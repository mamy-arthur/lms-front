/** @jest-environment node */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import { apiGet, apiPost } from '@/shared/lib/apiClient';
import { evaluationAttemptsApi, portalContentEntriesApi } from '../portal.api';

const ENROLLMENT_ID = '00000000-0000-4000-8000-000000000001';
const COMPETENCY_A = '00000000-0000-4000-8000-000000000002';
const COMPETENCY_B = '00000000-0000-4000-8000-000000000003';
const COURSE_ID = '00000000-0000-4000-8000-000000000004';
const ENTRY_ID = '00000000-0000-4000-8000-000000000005';
const CONTEXT = {
  node_execution_id: '00000000-0000-4000-8000-000000000006',
  expected_state_revision: 7,
};

describe('Complétion des contenus par module', () => {
  beforeEach(() => jest.resetAllMocks());

  it('adresse chaque validation au module concerné et permet de répéter le même appel', async () => {
    jest.mocked(apiPost).mockResolvedValue(undefined);
    for (const competencyId of [COMPETENCY_A, COMPETENCY_A, COMPETENCY_B]) {
      await expect(
        portalContentEntriesApi.markComplete(
          ENROLLMENT_ID,
          competencyId,
          COURSE_ID,
          ENTRY_ID,
          CONTEXT,
        ),
      ).resolves.toBeUndefined();
    }
    expect(jest.mocked(apiPost).mock.calls).toEqual(
      [COMPETENCY_A, COMPETENCY_A, COMPETENCY_B].map((competencyId) => [
        `enrollments/${ENROLLMENT_ID}/competencies/${competencyId}/courses/${COURSE_ID}/entries/${ENTRY_ID}/complete`,
        CONTEXT,
      ]),
    );
  });

  it('conserve la route de lecture du contenu sans paramètre de module', async () => {
    await portalContentEntriesApi.get(ENROLLMENT_ID, COURSE_ID, ENTRY_ID);
    expect(apiGet).toHaveBeenCalledWith(
      `enrollments/${ENROLLMENT_ID}/courses/${COURSE_ID}/entries/${ENTRY_ID}`,
    );
  });

  it('propage le refus de validation au lieu de considérer le contenu terminé', async () => {
    const error = { status: 403, message: 'Accès refusé' };
    jest.mocked(apiPost).mockRejectedValue(error);
    await expect(
      portalContentEntriesApi.markComplete(
        ENROLLMENT_ID,
        COMPETENCY_A,
        COURSE_ID,
        ENTRY_ID,
        CONTEXT,
      ),
    ).rejects.toBe(error);
  });
});

describe('Contrat d’exécution des tentatives d’évaluation', () => {
  beforeEach(() => jest.resetAllMocks());

  it('vérifie la session de visite séparément du démarrage explicite', async () => {
    const page_session_id = '00000000-0000-4000-8000-000000000007';
    await evaluationAttemptsApi.session(ENROLLMENT_ID, 'evaluation', {
      node_execution_id: CONTEXT.node_execution_id,
      page_session_id,
    });
    expect(apiPost).toHaveBeenLastCalledWith(
      `enrollments/${ENROLLMENT_ID}/evaluations/evaluation/attempts/session`,
      {
        node_execution_id: CONTEXT.node_execution_id,
        page_session_id,
      },
    );
    await evaluationAttemptsApi.start(ENROLLMENT_ID, 'evaluation', { ...CONTEXT, page_session_id });
    expect(apiPost).toHaveBeenLastCalledWith(
      `enrollments/${ENROLLMENT_ID}/evaluations/evaluation/attempts`,
      { ...CONTEXT, page_session_id },
    );
  });

  it('lit la tentative et envoie les révisions, effacements et motifs explicites', async () => {
    await evaluationAttemptsApi.get('attempt');
    expect(apiGet).toHaveBeenCalledWith('evaluation-attempts/attempt');
    const draft = { clear: true, answer_revision: 4, page_session_id: 'page' };
    await evaluationAttemptsApi.answer('attempt', 'question', draft);
    expect(apiPost).toHaveBeenLastCalledWith(
      'evaluation-attempts/attempt/quizzes/question/answer',
      draft,
    );
    await evaluationAttemptsApi.submit('attempt', { reason: 'timeout' });
    expect(apiPost).toHaveBeenLastCalledWith('evaluation-attempts/attempt/submit', {
      reason: 'timeout',
    });
    await evaluationAttemptsApi.submit('attempt');
    expect(apiPost).toHaveBeenLastCalledWith('evaluation-attempts/attempt/submit', undefined);
  });
});
