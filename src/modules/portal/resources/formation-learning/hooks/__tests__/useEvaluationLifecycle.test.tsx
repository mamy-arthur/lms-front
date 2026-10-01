import { StrictMode, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { evaluationAttemptsApi } from '@/shared/api/portal.api';
import type { EvaluationAttemptResponse } from '@/shared/api/portal.api';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import { useEvaluationLifecycle } from '../useEvaluationLifecycle';
import { evaluationDocument } from '../../lib/evaluation-document-session';
import { evaluationAttempt } from '../../lib/__fixtures__/evaluation-attempt';
import {
  evaluationTenant,
  evaluationUser,
  resetEvaluationIdentity,
} from '../../lib/__fixtures__/evaluation-identity';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';

jest.mock('@/shared/api/portal.api', () => ({
  evaluationAttemptsApi: {
    session: jest.fn(),
    start: jest.fn(),
    get: jest.fn(),
    answer: jest.fn(),
    submit: jest.fn(),
  },
}));
const api = jest.mocked(evaluationAttemptsApi);
const context = { node_execution_id: 'visit-1', expected_state_revision: 1 };
const initialIdentity = {
  enrollmentId: 'enrollment-1',
  evaluationId: 'evaluation-1',
  nodeExecutionId: 'visit-1',
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
const completed = (
  reason: 'manual' | 'timeout' | 'page_reload' = 'manual',
): EvaluationAttemptResponse => ({
  data: evaluationAttempt({ status: 'completed', completion_reason: reason, score: 50 }),
});
const settle = async () => {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
};
function setup(strict = false) {
  const onCompleted = jest.fn();
  const onStartError = jest.fn();
  const onRuntimeError = jest.fn();
  const hook = renderHook(
    (identity) =>
      useEvaluationLifecycle({
        ...identity,
        onCompleted,
        onStartError,
        onRuntimeError,
      }),
    {
      initialProps: initialIdentity,
      wrapper: ({ children }: { children: ReactNode }) =>
        strict ? <StrictMode>{children}</StrictMode> : children,
    },
  );
  return { ...hook, onCompleted, onStartError, onRuntimeError };
}

describe('Cycle de vie des évaluations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    resetEvaluationIdentity();
    delete window.__learneoEvaluationDocument;
    api.session.mockResolvedValue({ data: null });
    api.start.mockImplementation(async (_enrollment, _evaluation, ctx) => ({
      data: evaluationAttempt({ page_session_id: ctx.page_session_id }),
    }));
    api.get.mockResolvedValue({ data: evaluationAttempt() });
    api.answer.mockResolvedValue({ data: evaluationAttempt() });
    api.submit.mockResolvedValue(completed());
  });
  afterEach(() => {
    jest.useRealTimers();
    delete window.__learneoEvaluationDocument;
  });

  it('vérifie la session avant le splash et démarre uniquement sur action explicite', async () => {
    const { result } = setup();
    expect(result.current.phase).toBe('checking');
    expect(api.start).not.toHaveBeenCalled();
    await settle();
    expect(result.current.phase).toBe('ready');
    expect(api.session).toHaveBeenCalledWith('enrollment-1', 'evaluation-1', {
      node_execution_id: 'visit-1',
      page_session_id: evaluationDocument().id,
    });
    await act(async () => {
      await result.current.start(context);
    });
    expect(result.current.phase).toBe('active');
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(api.start).toHaveBeenCalledWith('enrollment-1', 'evaluation-1', {
      ...context,
      page_session_id: evaluationDocument().id,
    });
  });

  it('reste bloqué si la vérification est indisponible et permet une relance explicite', async () => {
    api.session.mockRejectedValueOnce(new Error('offline'));
    const { result } = setup();
    await settle();
    expect(result.current).toMatchObject({ phase: 'recovery_error', navigationLocked: true });
    await act(async () => {
      await result.current.start(context);
    });
    expect(api.start).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.recover();
    });
    expect(result.current.phase).toBe('ready');
  });

  it.each([false, true])(
    'récupère un rechargement hors ligne à la reconnexion sans doubler ni rejouer les écritures (StrictMode=%s)',
    async (strict) => {
      const previousDocumentId = evaluationDocument().id;
      delete window.__learneoEvaluationDocument; // A reload creates a new page token.
      api.session.mockRejectedValue(new TypeError('Failed to fetch'));
      const { result, onCompleted } = setup(strict);
      await settle();
      expect(result.current).toMatchObject({ phase: 'recovery_error', navigationLocked: true });
      const documentId = evaluationDocument().id;
      expect(documentId).not.toBe(previousDocumentId);
      // External-store hydration can defer the first check past StrictMode's
      // replay. Regardless of mount count, one online recovery is allowed.
      const initialChecks = api.session.mock.calls.length;
      expect(initialChecks).toBeGreaterThanOrEqual(1);
      expect(initialChecks).toBeLessThanOrEqual(strict ? 2 : 1);

      const recovery = deferred<EvaluationAttemptResponse>();
      api.session.mockReturnValueOnce(recovery.promise);
      act(() => {
        window.dispatchEvent(new Event('online'));
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current).toMatchObject({ phase: 'checking', navigationLocked: true });
      act(() => window.dispatchEvent(new Event('online')));
      expect(api.session).toHaveBeenCalledTimes(initialChecks + 1);
      expect(api.session).toHaveBeenLastCalledWith('enrollment-1', 'evaluation-1', {
        node_execution_id: 'visit-1',
        page_session_id: documentId,
      });

      const response = completed('page_reload');
      response.data.page_session_id = previousDocumentId;
      await act(async () => {
        recovery.resolve(response);
      });
      expect(result.current).toMatchObject({
        phase: 'completed',
        attempt: { completion_reason: 'page_reload' },
        navigationLocked: false,
        error: null,
      });
      act(() => window.dispatchEvent(new Event('online')));
      expect(api.session).toHaveBeenCalledTimes(initialChecks + 1);
      expect(onCompleted).toHaveBeenCalledTimes(1);
      expect(onCompleted).toHaveBeenCalledWith(response);
      expect(api.get).not.toHaveBeenCalled();
      expect(api.start).not.toHaveBeenCalled();
      expect(api.answer).not.toHaveBeenCalled();
      expect(api.submit).not.toHaveBeenCalled();
    },
  );

  it.each(['logout', 'simulation transition', 'unmount'] as const)(
    'ignore la reconnexion après %s même avant le nettoyage des effets',
    async (boundary) => {
      api.session.mockRejectedValue(new TypeError('Failed to fetch'));
      const { result, unmount, onCompleted } = setup(true);
      await settle();
      expect(result.current.phase).toBe('recovery_error');
      const checks = api.session.mock.calls.length;
      act(() => {
        if (boundary === 'logout') useAuthStore.getState().clearAuth();
        else if (boundary === 'simulation transition')
          useSimulationStore.setState({ phase: 'transition' });
        else unmount();
        window.dispatchEvent(new Event('online'));
      });
      await settle();
      act(() => window.dispatchEvent(new Event('online')));
      expect(api.session).toHaveBeenCalledTimes(checks);
      expect(onCompleted).not.toHaveBeenCalled();
      expect(api.get).not.toHaveBeenCalled();
      expect(api.start).not.toHaveBeenCalled();
      expect(api.answer).not.toHaveBeenCalled();
      expect(api.submit).not.toHaveBeenCalled();
    },
  );

  it.each(['page_reload', 'timeout'] as const)(
    'interdit de redémarrer la visite terminée %s et résout la nouvelle sans la démarrer',
    async (reason) => {
      api.session.mockResolvedValue(completed(reason));
      const { result, rerender, onCompleted } = setup(true);
      await settle();
      expect(result.current.phase).toBe('completed');
      expect(result.current.attempt?.completion_reason).toBe(reason);
      expect(onCompleted).toHaveBeenCalledTimes(1);
      expect(api.submit).not.toHaveBeenCalled();
      expect(api.start).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.start(context);
      });
      expect(result.current.phase).toBe('completed');
      expect(api.start).not.toHaveBeenCalled();
      api.session.mockResolvedValue({ data: null });
      rerender({ ...initialIdentity, nodeExecutionId: 'visit-2' });
      expect(result.current.attempt).toBeNull();
      await settle();
      expect(result.current.phase).toBe('ready');
      expect(api.start).not.toHaveBeenCalled();
    },
  );

  it('supporte StrictMode et le remontage sans soumettre au masquage ni au démontage', async () => {
    api.session.mockResolvedValue({
      data: evaluationAttempt({ page_session_id: evaluationDocument().id }),
    });
    const first = setup(true);
    await settle();
    expect(first.result.current.phase).toBe('active');
    act(() => first.result.current.saves?.change('question-1', new Set(['a'])));
    await settle();
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('beforeunload', { cancelable: true }));
    });
    first.unmount();
    const second = setup(true);
    await settle();
    expect(second.result.current.saves?.getAnswers()['question-1']).toEqual(new Set(['a']));
    expect(api.submit).not.toHaveBeenCalled();
    expect(new Set(api.session.mock.calls.map((call) => call[2].page_session_id)).size).toBe(1);
    expect(api.answer).toHaveBeenCalledTimes(1);
  });

  it('fige les réponses à zéro hors ligne sans les envoyer et finalise à la reconnexion', async () => {
    api.start.mockResolvedValue({
      data: evaluationAttempt({ time_limit_minutes: 1, expires_at: '2026-10-01T12:00:02.000Z' }),
    });
    api.answer.mockRejectedValue(new Error('offline'));
    api.submit.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(completed('timeout'));
    const { result } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    act(() => result.current.saves?.change('question-1', new Set(['a'])));
    await settle();
    expect(result.current.autosave.failed).toBe(true);
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(api.submit).toHaveBeenCalledWith('attempt-1', { reason: 'timeout' });
    expect(result.current).toMatchObject({
      phase: 'finalizing',
      frozen: true,
      navigationLocked: true,
    });
    expect(result.current.error).not.toBeNull();
    act(() => result.current.saves?.change('question-1', new Set(['b'])));
    expect(api.answer).toHaveBeenCalledTimes(1);
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    await settle();
    expect(result.current.phase).toBe('completed');
    expect(result.current.attempt?.completion_reason).toBe('timeout');
    expect(api.answer).toHaveBeenCalledTimes(1);
  });

  it('finalise à échéance sans attendre une sauvegarde manuelle bloquée', async () => {
    api.start.mockResolvedValue({
      data: evaluationAttempt({ expires_at: '2026-10-01T12:00:01.000Z' }),
    });
    let release!: (response: EvaluationAttemptResponse) => void;
    api.answer.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    api.submit.mockResolvedValue(completed('timeout'));
    const { result } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    act(() => result.current.saves?.change('question-1', new Set(['a'])));
    await settle();
    act(() => {
      void result.current.submitManual();
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(api.submit).toHaveBeenCalledWith('attempt-1', { reason: 'timeout' });
    expect(result.current.phase).toBe('completed');
    await act(async () => {
      release({ data: evaluationAttempt() });
    });
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('completed');
  });

  it('exige toutes les réponses manuellement et conserve les brouillons après un échec', async () => {
    const { result } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
      await result.current.submitManual();
    });
    expect(api.submit).not.toHaveBeenCalled();
    act(() => result.current.saves?.change('question-1', new Set(['a'])));
    api.submit.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await result.current.submitManual();
    });
    expect(result.current.phase).toBe('active');
    expect(result.current.saves?.getAnswers()['question-1']).toEqual(new Set(['a']));
    expect(result.current.error).not.toBeNull();
    await act(async () => {
      await result.current.submitManual();
    });
    expect(result.current.phase).toBe('completed');
    expect(api.answer).toHaveBeenCalledTimes(1);
  });

  it('adopte une complétion reçue pendant la sauvegarde et arrête les écritures', async () => {
    api.answer.mockResolvedValue(completed('timeout'));
    const { result } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    act(() => result.current.saves?.change('question-1', new Set(['a'])));
    await settle();
    expect(result.current.phase).toBe('completed');
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('détecte par interrogation la clôture depuis un autre onglet', async () => {
    api.get.mockResolvedValue(completed('page_reload'));
    const { result } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe('completed');
    expect(result.current.navigationLocked).toBe(false);
  });

  it('ne reprend jamais une tentative appartenant à un autre document', async () => {
    api.session.mockResolvedValue({
      data: evaluationAttempt({ page_session_id: 'different-document' }),
    });
    const { result } = setup();
    await settle();
    expect(result.current.phase).toBe('recovery_error');
    expect(api.start).not.toHaveBeenCalled();
  });

  it('vérifie un démarrage ambigu avant de proposer un nouveau démarrage', async () => {
    api.start.mockRejectedValueOnce(new Error('network response lost'));
    const { result } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    expect(result.current.phase).toBe('recovery_error');
    await act(async () => {
      await result.current.start(context);
    });
    expect(api.start).toHaveBeenCalledTimes(1);
    api.session.mockResolvedValue({
      data: evaluationAttempt({ page_session_id: evaluationDocument().id }),
    });
    await act(async () => {
      await result.current.recover();
    });
    expect(result.current.phase).toBe('active');
  });

  it('ignore une réponse de soumission ancienne après une nouvelle tentative explicite', async () => {
    let release!: (response: EvaluationAttemptResponse) => void;
    api.submit.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    api.get.mockResolvedValue(completed('page_reload'));
    const { result, rerender, onCompleted } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    act(() => result.current.saves?.change('question-1', new Set(['a'])));
    await settle();
    act(() => {
      void result.current.submitManual();
    });
    await settle();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe('completed');
    rerender({ ...initialIdentity, nodeExecutionId: 'visit-2' });
    await settle();
    api.start.mockResolvedValueOnce({
      data: evaluationAttempt({ id: 'attempt-2', node_execution_id: 'visit-2' }),
    });
    await act(async () => {
      await result.current.start({ node_execution_id: 'visit-2', expected_state_revision: 2 });
    });
    await act(async () => {
      release(completed());
    });
    expect(result.current).toMatchObject({ phase: 'active', attempt: { id: 'attempt-2' } });
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it.each(['enrollmentId', 'evaluationId', 'nodeExecutionId'] as const)(
    'réinitialise une tentative active lorsque %s change et abandonne les anciennes sauvegardes',
    async (field) => {
      const answer = deferred<EvaluationAttemptResponse>();
      api.answer.mockReturnValueOnce(answer.promise);
      const { result, rerender, onCompleted, onRuntimeError } = setup();
      await settle();
      await act(async () => {
        await result.current.start(context);
      });
      const oldSaves = result.current.saves!;
      const oldSubmit = result.current.submitManual;
      act(() => oldSaves.change('question-1', new Set(['a'])));
      await settle();
      act(() => oldSaves.change('question-1', new Set(['b'])));

      const nextIdentity = { ...initialIdentity, [field]: `${field}-2` };
      api.session.mockResolvedValueOnce({
        data: evaluationAttempt({
          id: 'attempt-2',
          enrollment_id: nextIdentity.enrollmentId,
          evaluation_id: nextIdentity.evaluationId,
          node_execution_id: nextIdentity.nodeExecutionId,
        }),
      });
      rerender(nextIdentity);
      expect(result.current).toMatchObject({
        phase: 'checking',
        attempt: null,
        navigationLocked: true,
      });
      await settle();
      expect(api.session).toHaveBeenLastCalledWith(
        nextIdentity.enrollmentId,
        nextIdentity.evaluationId,
        {
          node_execution_id: nextIdentity.nodeExecutionId,
          page_session_id: evaluationDocument().id,
        },
      );
      expect(result.current).toMatchObject({ phase: 'active', attempt: { id: 'attempt-2' } });
      await act(async () => {
        answer.resolve(completed('timeout'));
        await oldSubmit();
      });
      act(() => {
        oldSaves.retry();
        oldSaves.change('question-1', new Set(['a']));
      });
      await settle();
      expect(result.current.attempt?.id).toBe('attempt-2');
      expect(result.current.saves?.getAnswers()['question-1']).toBeNull();
      expect(api.answer).toHaveBeenCalledTimes(1);
      expect(api.submit).not.toHaveBeenCalled();
      expect(onCompleted).not.toHaveBeenCalled();
      expect(onRuntimeError).not.toHaveBeenCalled();
    },
  );

  it('ne relance pas la vérification pour une identité inchangée', async () => {
    const { result, rerender } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    const saves = result.current.saves;
    rerender({ ...initialIdentity });
    await settle();
    expect(api.session).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('active');
    expect(result.current.saves).toBe(saves);
  });

  it.each(['saved', 'completed', 'refused'] as const)(
    'ne fait aucun nouvel envoi après déconnexion pendant une sauvegarde %s et un flush manuel',
    async (outcome) => {
      const pending = deferred<EvaluationAttemptResponse>();
      api.answer.mockReturnValueOnce(pending.promise);
      const { result, onCompleted, onRuntimeError } = setup();
      await settle();
      await act(async () => {
        await result.current.start(context);
      });
      const oldDocument = evaluationDocument();
      const old = result.current;
      act(() => old.saves!.change('question-1', new Set(['a'])));
      await settle();
      act(() => {
        old.saves!.change('question-1', new Set(['b']));
        void old.submitManual();
      });
      expect(api.answer).toHaveBeenCalledTimes(1);
      act(() => {
        useAuthStore.getState().clearAuth();
        // The store subscription tears down queues before React has committed.
        expect(oldDocument.saves.size).toBe(0);
        old.saves!.retry();
      });
      expect(result.current).toMatchObject({ attempt: null, saves: null, navigationLocked: false });
      await act(async () => {
        if (outcome === 'refused') pending.reject({ status: 403 });
        else pending.resolve(outcome === 'completed' ? completed() : { data: evaluationAttempt() });
        await old.submitManual();
        await old.start(context);
        await result.current.recover();
        window.dispatchEvent(new Event('online'));
        jest.advanceTimersByTime(15_000);
      });
      expect(api.answer).toHaveBeenCalledTimes(1);
      expect(api.session).toHaveBeenCalledTimes(1);
      expect(api.start).toHaveBeenCalledTimes(1);
      expect(api.get).not.toHaveBeenCalled();
      expect(api.submit).not.toHaveBeenCalled();
      expect(old.saves!.getSnapshot()).toMatchObject({ completed: null, savedIds: [], failed: false });
      expect(onCompleted).not.toHaveBeenCalled();
      expect(onRuntimeError).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      'account',
      () => useAuthStore.getState().setAuth({ ...evaluationUser, id: 'learner-b' }, 'session-b'),
    ],
    ['session', () => useAuthStore.getState().setAuth(evaluationUser, 'session-b')],
    ['tenant', () => useTenantStore.getState().setTenant({ ...evaluationTenant, id: 'tenant-b' })],
    ['simulated role', () => useAuthStore.getState().setSimulatedRole(Role.TRAINEE)],
    ['simulation epoch', () => useSimulationStore.setState({ epoch: 1 })],
  ] as const)(
    'remplace le runtime sur changement de %s sans démontage ni modification des identifiants de visite',
    async (_label, changeIdentity) => {
      const pending = deferred<EvaluationAttemptResponse>();
      api.answer.mockReturnValueOnce(pending.promise);
      const { result, onCompleted } = setup();
      await settle();
      await act(async () => {
        await result.current.start(context);
      });
      const oldDocument = evaluationDocument();
      const oldManager = result.current.saves!;
      act(() => oldManager.change('question-1', new Set(['a'])));
      await settle();
      act(() => oldManager.change('question-1', new Set(['b'])));
      api.session.mockImplementationOnce(async (_enrollment, _evaluation, ctx) => ({
        data: evaluationAttempt({ page_session_id: ctx.page_session_id }),
      }));
      act(() => {
        changeIdentity();
      });
      await settle();
      const nextDocument = evaluationDocument();
      expect(nextDocument.id).not.toBe(oldDocument.id);
      expect(result.current).toMatchObject({ phase: 'active', attempt: { id: 'attempt-1' } });
      expect(result.current.saves).not.toBe(oldManager);
      expect(nextDocument.saves.get('attempt-1')).toBe(result.current.saves);
      expect(result.current.saves!.getAnswers()['question-1']).toBeNull();
      await act(async () => {
        pending.resolve(completed('timeout'));
        await oldManager.flush();
      });
      expect(api.answer).toHaveBeenCalledTimes(1);
      expect(onCompleted).not.toHaveBeenCalled();
      expect(oldManager.getSnapshot().completed).toBeNull();
      act(() => result.current.saves!.change('question-1', new Set(['b'])));
      await settle();
      expect(api.answer).toHaveBeenLastCalledWith(
        'attempt-1',
        'question-1',
        expect.objectContaining({ page_session_id: nextDocument.id, answer_revision: 1 }),
      );
    },
  );

  it('redémarre les horloges et les managers figés quand une simulation réutilise les mêmes ids', async () => {
    useAuthStore.getState().setSimulatedRole(Role.TRAINEE);
    useSimulationStore.setState({ phase: 'ready', epoch: 1 });
    api.start.mockResolvedValueOnce({
      data: evaluationAttempt({ expires_at: '2026-10-01T12:00:01.000Z' }),
    });
    api.submit.mockRejectedValueOnce(new Error('offline'));
    const { result, onCompleted } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    const oldDocument = evaluationDocument();
    const oldManager = result.current.saves!;
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toMatchObject({ phase: 'finalizing', frozen: true });
    expect(oldDocument.frozen.has('attempt-1')).toBe(true);
    act(() => useSimulationStore.setState({ phase: 'transition' }));
    expect(oldDocument.clocks.size).toBe(0);
    expect(oldDocument.saves.size).toBe(0);
    expect(oldDocument.frozen.size).toBe(0);
    expect(result.current).toMatchObject({
      phase: 'checking',
      attempt: null,
      navigationLocked: false,
    });
    expect(api.session).toHaveBeenCalledTimes(1);
    api.session.mockImplementationOnce(async (_enrollment, _evaluation, ctx) => ({
      data: evaluationAttempt({
        page_session_id: ctx.page_session_id,
        expires_at: '2026-10-01T12:01:00.000Z',
      }),
    }));
    act(() => useSimulationStore.setState({ phase: 'ready', epoch: 2 }));
    await settle();
    expect(result.current).toMatchObject({
      phase: 'active',
      frozen: false,
      deadline: { remaining: 60 },
    });
    expect(result.current.saves).not.toBe(oldManager);
    expect(evaluationDocument().id).not.toBe(oldDocument.id);
    act(() => {
      oldManager.retry();
      oldManager.change('question-1', new Set(['a']));
      result.current.saves!.change('question-1', new Set(['b']));
    });
    await settle();
    expect(api.answer).toHaveBeenCalledTimes(1);
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it.each(['checking', 'transition', 'error'] as const)(
    'bloque le premier dispatch différé et la récupération pendant la phase simulation %s',
    async (phase) => {
      const { result } = setup();
      await settle();
      await act(async () => {
        await result.current.start(context);
      });
      const oldManager = result.current.saves!;
      act(() => {
        oldManager.change('question-1', new Set(['a']));
        useSimulationStore.setState({ phase });
      });
      await settle();
      expect(api.answer).not.toHaveBeenCalled();
      expect(api.session).toHaveBeenCalledTimes(1);
      expect(result.current).toMatchObject({ attempt: null, saves: null, navigationLocked: false });
      act(() => useSimulationStore.setState({ phase: 'ready', epoch: 1 }));
      await settle();
      expect(api.session).toHaveBeenCalledTimes(2);
      expect(result.current.phase).toBe('ready');
      expect(api.start).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['session', 'start', 'get', 'submit'] as const)(
    'ignore la complétion %s en vol après changement de tenant, même pour les mêmes ids',
    async (source) => {
      const pending = deferred<EvaluationAttemptResponse>();
      const next = deferred<{ data: ApiEvaluationAttempt | null }>();
      api[source].mockReturnValueOnce(pending.promise);
      const { result, onCompleted, onStartError, onRuntimeError } = setup();
      if (source !== 'session') {
        await settle();
        act(() => {
          void result.current.start(context);
        });
        if (source !== 'start') await settle();
        if (source === 'get') {
          await act(async () => {
            jest.advanceTimersByTime(5000);
          });
        } else if (source === 'submit') {
          act(() => result.current.saves!.change('question-1', new Set(['a'])));
          await settle();
          act(() => {
            void result.current.submitManual();
          });
          await settle();
        }
      }
      expect(api[source]).toHaveBeenCalledTimes(1);
      api.session.mockReturnValueOnce(next.promise);
      await act(async () => {
        useTenantStore.getState().setTenant({ ...evaluationTenant, id: 'tenant-b' });
        pending.resolve(completed());
      });
      expect(result.current).toMatchObject({ phase: 'checking', attempt: null });
      expect(onCompleted).not.toHaveBeenCalled();
      expect(onStartError).not.toHaveBeenCalled();
      expect(onRuntimeError).not.toHaveBeenCalled();
      await act(async () => {
        next.resolve({ data: evaluationAttempt({ page_session_id: evaluationDocument().id }) });
      });
      expect(result.current.phase).toBe('active');
    },
  );

  it.each(['session', 'start'] as const)(
    'ignore la réponse %s ancienne pendant la vérification de la nouvelle visite',
    async (source) => {
      const old = deferred<EvaluationAttemptResponse>();
      const next = deferred<{ data: ApiEvaluationAttempt | null }>();
      if (source === 'session') api.session.mockReturnValueOnce(old.promise);
      else api.start.mockReturnValueOnce(old.promise);
      const { result, rerender, onCompleted, onStartError } = setup();
      if (source === 'start') {
        await settle();
        act(() => {
          void result.current.start(context);
        });
      }
      api.session.mockReturnValueOnce(next.promise);
      rerender({ ...initialIdentity, nodeExecutionId: 'visit-2' });
      await act(async () => {
        old.resolve(completed());
      });
      expect(result.current).toMatchObject({ phase: 'checking', attempt: null });
      expect(onCompleted).not.toHaveBeenCalled();
      expect(onStartError).not.toHaveBeenCalled();
      await act(async () => {
        next.resolve({ data: null });
      });
      expect(result.current.phase).toBe('ready');
      expect(api.start).toHaveBeenCalledTimes(source === 'start' ? 1 : 0);
    },
  );

  it.each(['completed', 'refused'] as const)(
    'ignore un ancien poll %s sans le rattacher à la nouvelle visite',
    async (outcome) => {
      const poll = deferred<EvaluationAttemptResponse>();
      const next = deferred<{ data: ApiEvaluationAttempt | null }>();
      api.get.mockReturnValueOnce(poll.promise);
      const { result, rerender, onCompleted, onRuntimeError } = setup();
      await settle();
      await act(async () => {
        await result.current.start(context);
      });
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      api.session.mockReturnValueOnce(next.promise);
      rerender({ ...initialIdentity, nodeExecutionId: 'visit-2' });
      await act(async () => {
        if (outcome === 'completed') poll.resolve(completed('page_reload'));
        else poll.reject({ status: 409, json: { error_code: 'execution_conflict' } });
      });
      expect(result.current).toMatchObject({ phase: 'checking', attempt: null });
      expect(onCompleted).not.toHaveBeenCalled();
      expect(onRuntimeError).not.toHaveBeenCalled();
      await act(async () => {
        next.resolve({
          data: evaluationAttempt({ id: 'attempt-2', node_execution_id: 'visit-2' }),
        });
      });
      expect(result.current.attempt?.id).toBe('attempt-2');
    },
  );

  it.each(['manual', 'timeout'] as const)(
    'ignore une soumission %s en vol après un changement de visite',
    async (reason) => {
      const submit = deferred<EvaluationAttemptResponse>();
      api.submit.mockReturnValueOnce(submit.promise);
      if (reason === 'timeout')
        api.start.mockResolvedValueOnce({
          data: evaluationAttempt({ expires_at: '2026-10-01T12:00:01.000Z' }),
        });
      const { result, rerender, onCompleted } = setup();
      await settle();
      await act(async () => {
        await result.current.start(context);
      });
      if (reason === 'manual') {
        act(() => result.current.saves?.change('question-1', new Set(['a'])));
        await settle();
        act(() => {
          void result.current.submitManual();
        });
        await settle();
      } else {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }
      expect(api.submit).toHaveBeenCalledWith('attempt-1', { reason });
      api.session.mockResolvedValueOnce({
        data: evaluationAttempt({ id: 'attempt-2', node_execution_id: 'visit-2' }),
      });
      rerender({ ...initialIdentity, nodeExecutionId: 'visit-2' });
      await settle();
      await act(async () => {
        submit.resolve(completed(reason));
      });
      expect(result.current).toMatchObject({
        phase: 'active',
        attempt: { id: 'attempt-2' },
        submitting: false,
        error: null,
      });
      expect(onCompleted).not.toHaveBeenCalled();
      expect(api.submit).toHaveBeenCalledTimes(1);
    },
  );

  it.each([401, 403, 404, 409, 422, 500])(
    'arrête les écritures après un poll HTTP %s et récupère sans rejeu des brouillons',
    async (status) => {
      const error = {
        status,
        json: { message: 'Tentative inaccessible', error_code: 'execution_conflict' },
      };
      api.get.mockRejectedValueOnce(error);
      const answer = deferred<EvaluationAttemptResponse>();
      api.answer.mockReturnValueOnce(answer.promise);
      const { result, onCompleted, onRuntimeError } = setup();
      await settle();
      await act(async () => {
        await result.current.start(context);
      });
      const oldSaves = result.current.saves!;
      act(() => oldSaves.change('question-1', new Set(['a'])));
      await settle();
      act(() => {
        oldSaves.change('question-1', new Set(['b']));
        void result.current.submitManual(); // Waiting on the old answer must not submit later.
      });
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current).toMatchObject({
        phase: 'recovery_error',
        attempt: null,
        navigationLocked: true,
        submitting: false,
        error: 'Tentative inaccessible',
      });
      expect(onRuntimeError).toHaveBeenCalledWith(error);
      await act(async () => {
        answer.resolve(completed());
      });
      // Reconnection verifies the session; the server still refuses this visit.
      api.session.mockRejectedValueOnce(error);
      await act(async () => {
        oldSaves.retry();
        window.dispatchEvent(new Event('online'));
        jest.advanceTimersByTime(15000);
        await result.current.start(context);
        await result.current.submitManual();
        await result.current.finalizeTimeout();
      });
      expect(result.current).toMatchObject({ phase: 'recovery_error', attempt: null });
      expect(api.session).toHaveBeenCalledTimes(2);
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.answer).toHaveBeenCalledTimes(1);
      expect(api.submit).not.toHaveBeenCalled();
      expect(api.start).toHaveBeenCalledTimes(1);
      expect(onCompleted).not.toHaveBeenCalled();
      api.session.mockResolvedValueOnce({ data: evaluationAttempt() });
      await act(async () => {
        await result.current.recover();
      });
      expect(result.current.phase).toBe('active');
      expect(result.current.saves).not.toBe(oldSaves);
      expect(result.current.saves?.getAnswers()['question-1']).toBeNull();
      expect(api.answer).toHaveBeenCalledTimes(1);
      expect(api.submit).not.toHaveBeenCalled();
    },
  );

  it('ne finalise pas à échéance après la révocation reçue par poll', async () => {
    api.start.mockResolvedValueOnce({
      data: evaluationAttempt({ expires_at: '2026-10-01T12:00:06.000Z' }),
    });
    api.get.mockRejectedValueOnce({ status: 403 });
    const { result } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    api.session.mockRejectedValueOnce({ status: 403 });
    await act(async () => {
      jest.advanceTimersByTime(10000);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.phase).toBe('recovery_error');
    expect(api.session).toHaveBeenCalledTimes(2);
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('refuse un statut annulé retourné par le serveur au lieu de rouvrir les réponses', async () => {
    api.get.mockResolvedValueOnce({
      data: { ...evaluationAttempt(), status: 'cancelled' } as unknown as ApiEvaluationAttempt,
    });
    const { result, onRuntimeError } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current).toMatchObject({
      phase: 'recovery_error',
      attempt: null,
      navigationLocked: true,
    });
    expect(onRuntimeError).toHaveBeenCalledTimes(1);
    expect(api.submit).not.toHaveBeenCalled();
  });

  it('tolère seulement la panne réseau du poll et conserve la finalisation à échéance', async () => {
    api.start.mockResolvedValueOnce({
      data: evaluationAttempt({ expires_at: '2026-10-01T12:00:06.000Z' }),
    });
    api.get.mockRejectedValue(new TypeError('Failed to fetch'));
    api.submit.mockResolvedValueOnce(completed('timeout'));
    const { result, onRuntimeError } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe('active');
    expect(onRuntimeError).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(api.submit).toHaveBeenCalledWith('attempt-1', { reason: 'timeout' });
    expect(result.current.phase).toBe('completed');
  });

  it('ne remplace pas un résultat confirmé par le refus tardif d’un poll', async () => {
    const poll = deferred<EvaluationAttemptResponse>();
    api.get.mockReturnValueOnce(poll.promise);
    const { result, onCompleted, onRuntimeError } = setup();
    await settle();
    await act(async () => {
      await result.current.start(context);
    });
    act(() => result.current.saves?.change('question-1', new Set(['a'])));
    await settle();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    // Both settle before passive polling cleanup, exercising the synchronous fence.
    await act(async () => {
      await result.current.submitManual();
      poll.reject({ status: 403 });
    });
    expect(result.current).toMatchObject({ phase: 'completed', navigationLocked: false });
    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(onRuntimeError).not.toHaveBeenCalled();
  });

  it('refuse une réponse de session portant l’identité de l’ancienne visite', async () => {
    const { result, rerender, onCompleted } = setup();
    await settle();
    api.session.mockResolvedValueOnce(completed());
    rerender({ ...initialIdentity, nodeExecutionId: 'visit-2' });
    await settle();
    expect(result.current).toMatchObject({
      phase: 'recovery_error',
      attempt: null,
      navigationLocked: true,
    });
    expect(onCompleted).not.toHaveBeenCalled();
    expect(api.start).not.toHaveBeenCalled();
  });
});
