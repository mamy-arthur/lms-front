/** @jest-environment jsdom */

import { Role } from '@/shared/constants/roles';
import type { EvaluationAttemptResponse } from '@/shared/api/portal.api';
import type {
  ApiEvaluationAttempt,
  EvaluationCompletionReason,
} from '@/shared/types/evaluation-attempt.types';
import type {
  ApiLearnerEvaluation,
  ApiPortalLearningPathSummary,
} from '@/shared/types/portal.types';
import type { TrainingReader } from '../training-source';
import { SIMULATION_IDS as id, simulationId } from '../fixtures';
import {
  clearSimulationData,
  configureSimulationTraining,
  handleSimulationRequest,
  hasSimulationChanges,
  resetSimulationData,
} from '../local-api';

const NOW = '2026-10-01T10:00:00.000Z';
const DEADLINE = '2026-10-01T10:01:00.000Z';
const PAGE = simulationId(9001);
const OTHER_PAGE = simulationId(9002);
const START = `enrollments/${id.enrollment}/evaluations/${id.evaluation}/attempts`;
const SUMMARY = `enrollments/${id.enrollment}/summary`;
const PAIRS = [
  { left: 'A', right: '1' },
  { left: 'B', right: '2' },
];

async function request<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
  const result = await handleSimulationRequest(path, {
    method,
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  return result.json as T;
}

async function summary() {
  return (await request<{ data: ApiPortalLearningPathSummary }>(SUMMARY)).data;
}

async function context(page = PAGE) {
  const tree = await summary();
  return {
    node_execution_id: tree.final_evaluation!.current_execution!.id,
    expected_state_revision: tree.state_revision,
    page_session_id: page,
  };
}

async function start(minutes: number | null = 1) {
  await request(`platform/evaluations/${id.evaluation}`, 'PATCH', { time_limit_minutes: minutes });
  return (await request<EvaluationAttemptResponse>(START, 'POST', await context())).data;
}

function poll(attempt: ApiEvaluationAttempt) {
  return request<EvaluationAttemptResponse>(`evaluation-attempts/${attempt.id}`);
}

function answer(attempt: ApiEvaluationAttempt, value: Record<string, unknown>, revision = 1) {
  return request<EvaluationAttemptResponse>(
    `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`,
    'POST',
    { page_session_id: PAGE, answer_revision: revision, ...value },
  );
}

function submit(attempt: ApiEvaluationAttempt, reason?: EvaluationCompletionReason) {
  return request<EvaluationAttemptResponse>(
    `evaluation-attempts/${attempt.id}/submit`,
    'POST',
    reason ? { reason } : undefined,
  );
}

function session(attempt: ApiEvaluationAttempt, page = PAGE) {
  return request<EvaluationAttemptResponse>(`${START}/session`, 'POST', {
    node_execution_id: attempt.node_execution_id,
    page_session_id: page,
  });
}

async function usage() {
  return (
    await request<{ data: ApiLearnerEvaluation[] }>(`enrollments/${id.enrollment}/evaluations`)
  ).data[0];
}

describe('contrat des sessions et délais des évaluations simulées', () => {
  const descriptors = new Map<string, PropertyDescriptor | undefined>();
  const forbidden = jest.fn(() => {
    throw new Error('Réseau et stockage interdits');
  });

  beforeAll(() => {
    const storage = {
      getItem: forbidden,
      setItem: forbidden,
      removeItem: forbidden,
      clear: forbidden,
    };
    for (const [key, value] of Object.entries({
      fetch: forbidden,
      XMLHttpRequest: forbidden,
      WebSocket: forbidden,
      navigator: { sendBeacon: forbidden },
      localStorage: storage,
      sessionStorage: storage,
    })) {
      descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
      Object.defineProperty(globalThis, key, { configurable: true, value });
    }
  });

  afterAll(() => {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });

  beforeEach(() => {
    forbidden.mockClear();
    jest.useFakeTimers().setSystemTime(new Date(NOW));
    resetSimulationData(Role.TRAINEE);
  });

  afterEach(() => {
    clearSimulationData();
    jest.useRealTimers();
    expect(forbidden).not.toHaveBeenCalled();
  });

  it('résout une visite vierge sans démarrer ni modifier la progression', async () => {
    const before = await summary();
    const payload = await context();
    expect(
      await request(`${START}/session`, 'POST', {
        node_execution_id: payload.node_execution_id,
        page_session_id: PAGE,
      }),
    ).toEqual({ data: null });
    expect(await summary()).toEqual(before);
    expect(await usage()).toMatchObject({ attempts_used: 0, last_attempt_status: null });
    expect(hasSimulationChanges()).toBe(false);
  });

  it('fige le délai au démarrage et rejoue les démarrages de la même page sans consommer le budget', async () => {
    await request(`platform/evaluations/${id.evaluation}`, 'PATCH', { time_limit_minutes: 1 });
    const payload = await context();
    const responses = await Promise.all(
      [0, 1].map(() =>
        handleSimulationRequest(START, {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      ),
    );
    expect(responses.map((result) => result.status)).toEqual([201, 200]);
    const attempt = (responses[0].json as EvaluationAttemptResponse).data;
    expect(responses[1].json).toEqual(responses[0].json);
    expect(attempt).toMatchObject({
      started_at: NOW,
      expires_at: DEADLINE,
      server_now: NOW,
      time_limit_minutes: 1,
      page_session_id: PAGE,
      completion_reason: null,
      node_execution_id: payload.node_execution_id,
      quizzes: [{ submitted_answer: null, answer_revision: 0 }],
    });
    expect(attempt.quizzes[0]).not.toHaveProperty('correct_answer');
    const before = (await summary()).execution;
    await request(`platform/evaluations/${id.evaluation}`, 'PATCH', { time_limit_minutes: 9 });
    jest.setSystemTime(new Date('2026-10-01T10:00:20.000Z'));
    expect(await request(START, 'POST', payload)).toMatchObject({
      data: {
        id: attempt.id,
        started_at: NOW,
        expires_at: DEADLINE,
        time_limit_minutes: 1,
        server_now: new Date().toISOString(),
      },
    });
    expect((await poll(attempt)).data).toMatchObject({
      id: attempt.id,
      started_at: NOW,
      expires_at: DEADLINE,
      time_limit_minutes: 1,
      server_now: new Date().toISOString(),
    });
    // Simulation projects live configuration; only the attempt's timer is frozen, not the graph.
    const after = (await summary()).execution;
    expect(after.state_revision).toBe(before.state_revision);
    expect(after.current_execution).toEqual(before.current_execution);
    for (const [key, node] of Object.entries(before.nodes)) {
      expect(after.nodes[key].current_execution).toEqual(node.current_execution);
      expect(after.nodes[key].history).toEqual(node.history);
    }
    expect(await usage()).toMatchObject({ attempts_used: 1, time_limit_minutes: 9 });
  });

  it('refuse les contextes invalides avant toute création', async () => {
    const payload = await context();
    await expect(request(START, 'POST', { page_session_id: PAGE })).rejects.toMatchObject({
      status: 422,
    });
    await expect(
      request(START, 'POST', {
        ...payload,
        expected_state_revision: payload.expected_state_revision + 1,
      }),
    ).rejects.toMatchObject({ status: 409, json: { error_code: 'execution_conflict' } });
    await expect(
      request(`${START}/session`, 'POST', {
        ...payload,
        node_execution_id: simulationId(9999),
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      request(`${START}/session`, 'POST', {
        node_execution_id: payload.node_execution_id,
      }),
    ).rejects.toMatchObject({ status: 422 });
    expect(await usage()).toMatchObject({ attempts_used: 0 });
    expect(hasSimulationChanges()).toBe(false);
  });

  it('ne résout jamais une tentative depuis une autre évaluation ou inscription', async () => {
    const attempt = await start();
    const other = await request<{ data: { id: string } }>(
      `platform/learning-paths/${id.learningPath}/evaluations`,
      'POST',
      {
        title: 'Autre évaluation',
        type: 'FINAL',
        question_bank_ids: [id.questionBank],
        question_count: 1,
        is_published: true,
      },
    );
    await expect(
      request(
        `enrollments/${id.enrollment}/evaluations/${other.data.id}/attempts/session`,
        'POST',
        {
          node_execution_id: attempt.node_execution_id,
          page_session_id: OTHER_PAGE,
        },
      ),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      request(
        `enrollments/${id.scormEnrollment}/evaluations/${id.evaluation}/attempts/session`,
        'POST',
        {
          node_execution_id: attempt.node_execution_id,
          page_session_id: OTHER_PAGE,
        },
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect((await poll(attempt)).data.status).toBe('in_progress');
    expect(await usage()).toMatchObject({ attempts_used: 1 });
  });

  it('reprend la même page, puis finalise un rechargement sans créer de tentative suivante', async () => {
    const attempt = await start();
    const before = (await summary()).execution;
    expect((await session(attempt)).data.status).toBe('in_progress');
    expect((await summary()).execution).toEqual(before);
    jest.setSystemTime(new Date('2026-10-01T10:00:10.000Z'));
    const completed = await session(attempt, OTHER_PAGE);
    expect(completed.data).toMatchObject({
      id: attempt.id,
      status: 'completed',
      score: 0,
      completion_reason: 'page_reload',
      completed_at: new Date().toISOString(),
      page_session_id: PAGE,
    });
    expect(completed.execution).toEqual((await summary()).execution);
    expect(await session(attempt, OTHER_PAGE)).toEqual(completed);
    expect(
      await request(START, 'POST', {
        node_execution_id: attempt.node_execution_id,
        expected_state_revision: 0,
        page_session_id: PAGE,
      }),
    ).toEqual(completed);
    expect(await usage()).toMatchObject({ attempts_used: 1 });
    // A new page alone cannot start a completed, non-actionable local visit.
    await expect(request(START, 'POST', await context(OTHER_PAGE))).rejects.toMatchObject({
      status: 409,
    });
  });

  it('protège le démarrage actif contre un appel sans jeton et finalise une autre page', async () => {
    const payload = await context();
    const attempt = (await request<EvaluationAttemptResponse>(START, 'POST', payload)).data;
    await expect(request(START, 'POST')).rejects.toMatchObject({ status: 409 });
    const result = await request<EvaluationAttemptResponse>(START, 'POST', {
      ...payload,
      page_session_id: OTHER_PAGE,
    });
    expect(result.data).toMatchObject({
      id: attempt.id,
      completion_reason: 'page_reload',
      score: 0,
    });
    expect(await usage()).toMatchObject({ attempts_used: 1 });
  });

  it('ne permet ni timeout anticipé ni soumission manuelle incomplète', async () => {
    const attempt = await start();
    const before = (await summary()).execution;
    await expect(submit(attempt, 'timeout')).rejects.toMatchObject({ status: 409 });
    await expect(submit(attempt)).rejects.toMatchObject({ status: 409 });
    await expect(
      request(`evaluation-attempts/${attempt.id}/submit`, 'POST', {
        reason: 'forged',
      }),
    ).rejects.toMatchObject({ status: 422 });
    expect((await poll(attempt)).data.status).toBe('in_progress');
    expect((await summary()).execution).toEqual(before);
  });

  it.each<EvaluationCompletionReason>(['manual', 'timeout', 'page_reload'])(
    'donne priorité à timeout à la limite exacte même pour %s',
    async (reason) => {
      const attempt = await start();
      jest.setSystemTime(new Date(DEADLINE));
      const completed = await submit(attempt, reason);
      expect(completed.data).toMatchObject({
        status: 'completed',
        score: 0,
        completion_reason: 'timeout',
        completed_at: DEADLINE,
      });
      expect(completed.execution).toEqual((await summary()).execution);
      expect(await submit(attempt, 'page_reload')).toEqual(completed);
    },
  );

  it('donne aussi priorité à timeout lors du rechargement ou de la reprise du démarrage', async () => {
    const attempt = await start();
    jest.setSystemTime(new Date('2026-10-01T10:02:00.000Z'));
    expect((await session(attempt, OTHER_PAGE)).data).toMatchObject({
      completion_reason: 'timeout',
      completed_at: DEADLINE,
    });
    expect((await request<EvaluationAttemptResponse>(START, 'POST', await context())).data.id).toBe(
      attempt.id,
    );
    expect(await usage()).toMatchObject({ attempts_used: 1 });
  });

  it.each([PAGE, OTHER_PAGE])(
    'finalise un démarrage rejoué à échéance depuis la page %s',
    async (page) => {
      const attempt = await start();
      jest.setSystemTime(new Date(DEADLINE));
      const result = await request<EvaluationAttemptResponse>(START, 'POST', {
        node_execution_id: attempt.node_execution_id,
        expected_state_revision: 0,
        page_session_id: page,
      });
      expect(result.data).toMatchObject({
        id: attempt.id,
        completion_reason: 'timeout',
        completed_at: DEADLINE,
      });
      expect(await usage()).toMatchObject({ attempts_used: 1 });
    },
  );

  it('expire au polling, note les réponses sauvegardées et ne rejoue jamais la progression', async () => {
    await request(`platform/question-banks/${id.questionBank}/quizzes`, 'POST', {
      type: 'true_false',
      question: 'Une seconde question ?',
      correct_answer: true,
    });
    await request(`platform/evaluations/${id.evaluation}`, 'PATCH', { question_count: 2 });
    const attempt = await start();
    await answer(attempt, { answer: true });
    const before = (await summary()).execution;
    jest.setSystemTime(new Date('2026-10-01T10:00:59.999Z'));
    expect((await poll(attempt)).data.status).toBe('in_progress');
    expect((await summary()).execution).toEqual(before);
    jest.setSystemTime(new Date(DEADLINE));
    const completed = await poll(attempt);
    expect(completed.data).toMatchObject({
      status: 'completed',
      score: 50,
      completion_reason: 'timeout',
    });
    expect(completed.execution!.state_revision).toBeGreaterThan(before.state_revision);
    expect(await answer(attempt, { answer: false }, 2)).toEqual(completed);
    expect(await submit(attempt)).toEqual(completed);
    expect(await poll(attempt)).toEqual(completed);
    expect((await summary()).execution).toEqual(completed.execution);
  });

  it('finalise une réponse arrivée à échéance sans sauvegarder son contenu ni sa révision', async () => {
    const attempt = await start();
    jest.setSystemTime(new Date(DEADLINE));
    const completed = await answer(attempt, { answer: true, page_session_id: OTHER_PAGE });
    expect(completed.data).toMatchObject({
      score: 0,
      completion_reason: 'timeout',
      completed_at: DEADLINE,
      quizzes: [{ submitted_answer: null, answer_revision: 0 }],
    });
    expect(completed.execution).toBeDefined();
    expect(await answer(attempt, { clear: true }, 2)).toEqual(completed);
  });

  it('ordonne les brouillons par question, efface une réponse et ignore les révisions obsolètes', async () => {
    const attempt = await start();
    const saved = await answer(attempt, { answer: true, unexpected: 'discard' }, 2);
    expect(saved.data.quizzes[0]).toMatchObject({
      submitted_answer: { answer: true },
      answer_revision: 2,
    });
    expect(saved.data.quizzes[0].submitted_answer).toEqual({ answer: true });
    expect(saved.execution).toBeUndefined();
    expect(await answer(attempt, { answer: false }, 1)).toEqual(saved);
    expect(await answer(attempt, { clear: true }, 2)).toEqual(saved);
    const cleared = await answer(attempt, { clear: true }, 3);
    expect(cleared.data.quizzes[0]).toMatchObject({ submitted_answer: null, answer_revision: 3 });
    expect(await answer(attempt, { answer: true }, 2)).toEqual(cleared);
    await expect(submit(attempt)).rejects.toMatchObject({ status: 409 });
    await answer(attempt, { answer: false }, 4);
    const completed = await submit(attempt);
    expect(completed.data).toMatchObject({
      status: 'completed',
      score: 0,
      completion_reason: 'manual',
    });
    expect(completed.data.quizzes[0].submitted_answer).toEqual({ answer: false });
    expect(await answer(attempt, { answer: true }, 5)).toEqual(completed);
  });

  it('conserve une révision indépendante pour chaque question', async () => {
    await request(`platform/question-banks/${id.questionBank}/quizzes`, 'POST', {
      type: 'true_false',
      question: 'Seconde réponse ?',
      correct_answer: true,
    });
    await request(`platform/evaluations/${id.evaluation}`, 'PATCH', { question_count: 2 });
    const attempt = await start();
    await answer(attempt, { answer: true }, 10);
    const result = await request<EvaluationAttemptResponse>(
      `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[1].id}/answer`,
      'POST',
      {
        answer: true,
        page_session_id: PAGE,
        answer_revision: 1,
      },
    );
    expect(result.data.quizzes.map((quiz) => quiz.answer_revision)).toEqual([10, 1]);
    expect((await submit(attempt)).data.score).toBe(100);
  });

  it('refuse les métadonnées manquantes ou falsifiées sans modifier le brouillon', async () => {
    const attempt = await start();
    const path = `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`;
    for (const payload of [
      { answer: true },
      { clear: true, answer_revision: 1 },
      { clear: true, page_session_id: PAGE },
    ])
      await expect(request(path, 'POST', payload)).rejects.toMatchObject({ status: 422 });
    await expect(
      answer(attempt, { clear: true, page_session_id: OTHER_PAGE }),
    ).rejects.toMatchObject({ status: 409 });
    for (const revision of [0, -1, 1.5, 'bad', 2147483648]) {
      await expect(
        request(path, 'POST', {
          answer: true,
          answer_revision: revision,
          page_session_id: PAGE,
        }),
      ).rejects.toMatchObject({ status: 422 });
    }
    expect((await poll(attempt)).data.quizzes[0]).toMatchObject({
      submitted_answer: null,
      answer_revision: 0,
    });
  });

  it('accepte les paires partielles en brouillon mais exige toutes les paires en soumission manuelle', async () => {
    await request(`platform/quizzes/${id.quiz}`, 'PATCH', { type: 'matching', pairs: PAIRS });
    const attempt = await start();
    expect(
      (await answer(attempt, { pairs: PAIRS.slice(0, 1) })).data.quizzes[0].submitted_answer,
    ).toEqual({ pairs: PAIRS.slice(0, 1) });
    await expect(submit(attempt)).rejects.toMatchObject({ status: 409 });
    for (const pairs of [
      [{ left: 'X', right: '1' }],
      [
        { left: 'A', right: '1' },
        { left: 'A', right: '2' },
      ],
      [
        { left: 'A', right: '1' },
        { left: 'B', right: '1' },
      ],
    ])
      await expect(answer(attempt, { pairs }, 2)).rejects.toMatchObject({ status: 422 });
    await answer(attempt, { pairs: PAIRS }, 2);
    expect((await submit(attempt)).data).toMatchObject({ score: 100, completion_reason: 'manual' });
  });

  it('finalise aussi un brouillon de paires partielles avec la notation locale existante', async () => {
    await request(`platform/quizzes/${id.quiz}`, 'PATCH', { type: 'matching', pairs: PAIRS });
    const attempt = await start();
    await answer(attempt, { pairs: PAIRS.slice(0, 1) });
    jest.setSystemTime(new Date(DEADLINE));
    expect((await poll(attempt)).data).toMatchObject({ score: 0, completion_reason: 'timeout' });
  });

  it('conserve les appels legacy sans jeton sans rendre les tentatives protégées contournables', async () => {
    const attempt = (await request<EvaluationAttemptResponse>(START, 'POST')).data;
    expect(attempt.page_session_id).toBeNull();
    expect((await session(attempt, OTHER_PAGE)).data.status).toBe('in_progress');
    const path = `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`;
    await request(path, 'POST', { answer: true });
    expect((await submit(attempt)).data.score).toBe(100);
    // The old fixture-only start path still supports explicit legacy retries.
    const second = (await request<EvaluationAttemptResponse>(START, 'POST')).data;
    expect(second.id).not.toBe(attempt.id);
    expect((await session(second)).data.id).toBe(second.id);
    expect(await usage()).toMatchObject({ attempts_used: 2 });
  });

  it('garde la validation complète des paires pour les anciennes tentatives sans jeton', async () => {
    await request(`platform/quizzes/${id.quiz}`, 'PATCH', { type: 'matching', pairs: PAIRS });
    const attempt = (await request<EvaluationAttemptResponse>(START, 'POST')).data;
    const path = `evaluation-attempts/${attempt.id}/quizzes/${attempt.quizzes[0].id}/answer`;
    await expect(request(path, 'POST', { pairs: PAIRS.slice(0, 1) })).rejects.toMatchObject({
      status: 422,
    });
    await request(path, 'POST', { pairs: PAIRS });
    expect((await submit(attempt)).data.score).toBe(100);
  });

  it('autorise une finalisation page_reload sans réponse même sans limite de temps', async () => {
    const attempt = await start(null);
    const completed = await submit(attempt, 'page_reload');
    expect(completed.data).toMatchObject({
      status: 'completed',
      score: 0,
      completion_reason: 'page_reload',
      completed_at: NOW,
    });
    expect(completed.execution).toEqual((await summary()).execution);
  });

  it('ne déclenche jamais timeout sans limite et ne réutilise rien après reset/clear', async () => {
    const attempt = await start(null);
    expect(attempt).toMatchObject({ time_limit_minutes: null, expires_at: null });
    jest.setSystemTime(new Date('2026-10-04T10:00:00.000Z'));
    expect((await poll(attempt)).data.status).toBe('in_progress');
    await expect(submit(attempt, 'timeout')).rejects.toMatchObject({ status: 409 });
    resetSimulationData(Role.TRAINEE);
    await expect(poll(attempt)).rejects.toMatchObject({ status: 404 });
    expect(await request(`${START}/session`, 'POST', await context())).toEqual({ data: null });
    expect(hasSimulationChanges()).toBe(false);
    clearSimulationData();
    await expect(poll(attempt)).rejects.toMatchObject({
      status: 409,
      json: { code: 'SIMULATION_INACTIVE' },
    });
  });

  it('charge la limite du catalogue autorisé et garde tout le cycle des tentatives en RAM', async () => {
    const base = 'role-simulation/training/learning-paths';
    const path = { id: 'real-path', name: 'Formation chronométrée', competencies_count: 0 };
    const reader = jest.fn(async (url: string): Promise<unknown> => {
      if (url === base) return { data: [path], meta: { current_page: 1, last_page: 1 } };
      if (url === `${base}/${path.id}`)
        return {
          data: {
            resources: {
              'learning-paths': [{ ...path, competencies: [] }],
              'question-banks': [
                { id: 'real-bank', title: 'Banque', learning_path_ids: [path.id] },
              ],
              evaluations: [
                {
                  id: 'real-evaluation',
                  learning_path_id: path.id,
                  title: 'Évaluation',
                  type: 'FINAL',
                  question_bank_ids: ['real-bank'],
                  question_count: 1,
                  max_attempts: null,
                  is_published: true,
                  time_limit_minutes: 2,
                },
              ],
              quizzes: [
                {
                  id: 'real-quiz',
                  question_bank_id: 'real-bank',
                  type: 'true_false',
                  question: 'Réponse ?',
                  correct_answer: true,
                },
              ],
            },
          },
        };
      throw new Error(`Lecture non autorisée : ${url}`);
    });
    configureSimulationTraining('timer-preview', reader as TrainingReader);
    const registration = (await request<{ data: Array<{ id: string }> }>('me/enrollments')).data[0];
    const tree = (
      await request<{ data: ApiPortalLearningPathSummary }>(
        `enrollments/${registration.id}/summary`,
      )
    ).data;
    const evaluation = tree.final_evaluation!;
    expect(evaluation.time_limit_minutes).toBe(2);
    const url = `enrollments/${registration.id}/evaluations/${evaluation.id}/attempts`;
    const payload = {
      node_execution_id: evaluation.current_execution!.id,
      expected_state_revision: tree.state_revision,
      page_session_id: PAGE,
    };
    expect(await request(`${url}/session`, 'POST', payload)).toEqual({ data: null });
    const attempt = (await request<EvaluationAttemptResponse>(url, 'POST', payload)).data;
    expect(attempt).toMatchObject({
      time_limit_minutes: 2,
      expires_at: '2026-10-01T10:02:00.000Z',
    });
    expect(attempt.evaluation_id).not.toBe('real-evaluation');
    await answer(attempt, { answer: true });
    jest.setSystemTime(new Date(attempt.expires_at!));
    expect((await poll(attempt)).data).toMatchObject({ score: 100, completion_reason: 'timeout' });
    await submit(attempt);
    expect(reader.mock.calls.map(([url]) => url)).toEqual([base, `${base}/${path.id}`]);
  });
});
