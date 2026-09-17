/** @jest-environment node */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import { apiGet, apiPost } from '@/shared/lib/apiClient';
import { portalContentEntriesApi } from '../portal.api';

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
