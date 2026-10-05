import { EvaluationAutosave } from '../evaluation-autosave';
import { evaluationAttempt } from '../__fixtures__/evaluation-attempt';
import { fromApiAnswer, toApiPayload } from '../evaluation-attempt-utils';
import type { EvaluationAttemptResponse } from '@/shared/api/portal.api';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('Sauvegarde progressive des évaluations', () => {
  it('vérifie l’identité au dispatch et non seulement au changement de réponse', async () => {
    let current = true;
    const send = jest.fn();
    const saves = new EvaluationAutosave(
      evaluationAttempt(),
      'page',
      send,
      () => true,
      () => current,
    );
    saves.change('question-1', new Set(['a']));
    current = false; // Identity switches before the deferred drain begins.
    await expect(saves.flush()).rejects.toThrow('Certaines réponses');
    saves.retry();
    expect(send).not.toHaveBeenCalled();
  });

  it.each(['saved', 'completed'] as const)(
    'ignore une réponse %s et la révision suivante si l’identité capturée est périmée',
    async (outcome) => {
      let current = true;
      const pending = deferred<EvaluationAttemptResponse>();
      const send = jest.fn().mockReturnValue(pending.promise);
      const saves = new EvaluationAutosave(
        evaluationAttempt(),
        'page',
        send,
        () => true,
        () => current,
      );
      saves.change('question-1', new Set(['a']));
      await Promise.resolve();
      saves.change('question-1', new Set(['b']));
      const snapshot = saves.getSnapshot();
      const listener = jest.fn();
      const unsubscribe = saves.subscribe(listener);
      current = false;
      pending.resolve({
        data: evaluationAttempt({ status: outcome === 'completed' ? 'completed' : 'in_progress' }),
      });
      await expect(saves.flush()).rejects.toThrow('Certaines réponses');
      saves.retry();
      saves.change('question-1', new Set());
      expect(send).toHaveBeenCalledTimes(1);
      expect(saves.getSnapshot()).toBe(snapshot);
      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    },
  );

  it('sérialise les réponses par question et envoie les effacements avec une révision supérieure', async () => {
    const attempt = evaluationAttempt();
    const first = deferred<EvaluationAttemptResponse>();
    const send = jest.fn().mockReturnValueOnce(first.promise).mockResolvedValue({ data: attempt });
    const saves = new EvaluationAutosave(attempt, 'page', send, () => true);
    saves.change('question-1', new Set(['a']));
    await Promise.resolve();
    expect(send).toHaveBeenCalledWith('attempt-1', 'question-1', {
      selected_option_ids: ['a'],
      answer_revision: 1,
      page_session_id: 'page',
    });
    saves.change('question-1', new Set(['a', 'b']));
    saves.change('question-1', new Set());
    expect(send).toHaveBeenCalledTimes(1);
    first.resolve({ data: attempt });
    await saves.flush();
    expect(send).toHaveBeenLastCalledWith('attempt-1', 'question-1', {
      clear: true,
      answer_revision: 3,
      page_session_id: 'page',
    });
    expect(saves.getSnapshot()).toMatchObject({
      pending: false,
      failed: false,
      savedIds: ['question-1'],
    });
  });

  it('conserve les brouillons en erreur et réessaie la même révision avant les nouvelles modifications', async () => {
    const attempt = evaluationAttempt();
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ data: attempt });
    const saves = new EvaluationAutosave(attempt, 'page', send, () => true);
    saves.change('question-1', new Set(['b']));
    await expect(saves.flush()).rejects.toThrow('Certaines réponses');
    expect(saves.getSnapshot()).toMatchObject({ pending: true, failed: true, savedIds: [] });
    expect(saves.getAnswers()['question-1']).toEqual(new Set(['b']));
    await saves.flush();
    expect(send.mock.calls.map((call) => call[2].answer_revision)).toEqual([1, 1]);
    saves.change('question-1', new Set(['a']));
    await saves.flush();
    expect(send.mock.calls[2][2].answer_revision).toBe(2);
  });

  it('reprend les révisions serveur, conserve false et sauvegarde les associations partielles ou vides', async () => {
    const quiz = {
      ...evaluationAttempt().quizzes[0],
      type: 'matching' as const,
      left_values: ['Left A', 'Left B'],
      right_values: ['Right A', 'Right B'],
      answer_revision: 7,
      submitted_answer: { pairs: [{ left: 'Left B', right: 'Right A' }] },
    };
    const attempt = evaluationAttempt({ quizzes: [quiz] });
    const send = jest.fn().mockResolvedValue({ data: attempt });
    const saves = new EvaluationAutosave(attempt, 'page', send, () => true);
    expect(saves.getAnswers()['question-1']).toEqual({ '1': '0' });
    saves.change(quiz.id, { '0': '1' });
    await saves.flush();
    expect(send).toHaveBeenLastCalledWith(attempt.id, quiz.id, {
      pairs: [{ left: 'Left A', right: 'Right B' }],
      answer_revision: 8,
      page_session_id: 'page',
    });
    saves.change(quiz.id, {});
    await saves.flush();
    expect(send.mock.calls[1][2]).toMatchObject({ clear: true, answer_revision: 9 });
    expect(
      fromApiAnswer({ ...quiz, type: 'true_false', submitted_answer: { answer: false } }),
    ).toBe(false);
    expect(toApiPayload({ ...quiz, type: 'true_false' }, false)).toEqual({ answer: false });
    expect(toApiPayload(quiz, null)).toEqual({ clear: true });
  });

  it('arrête les écritures en attente après une réponse serveur terminée', async () => {
    const attempt = evaluationAttempt();
    const first = deferred<EvaluationAttemptResponse>();
    const send = jest.fn().mockReturnValue(first.promise);
    const saves = new EvaluationAutosave(attempt, 'page', send, () => true);
    saves.change('question-1', new Set(['a']));
    await Promise.resolve();
    saves.change('question-1', new Set(['b']));
    const completed = {
      data: evaluationAttempt({ status: 'completed', completion_reason: 'timeout' }),
    };
    first.resolve(completed);
    await saves.flush();
    saves.retry();
    saves.change('question-1', new Set());
    expect(send).toHaveBeenCalledTimes(1);
    expect(saves.getSnapshot().completed).toEqual(completed);
  });

  it('ne sauvegarde plus après échéance, même avec une réponse en erreur', async () => {
    let active = true;
    const send = jest.fn().mockRejectedValue(new Error('offline'));
    const saves = new EvaluationAutosave(evaluationAttempt(), 'page', send, () => active);
    saves.change('question-1', new Set(['a']));
    await expect(saves.flush()).rejects.toThrow();
    active = false;
    saves.retry();
    saves.change('question-1', new Set(['b']));
    await expect(saves.flush()).rejects.toThrow();
    expect(send).toHaveBeenCalledTimes(1);
  });
});
