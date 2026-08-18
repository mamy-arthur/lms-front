import type { ApiPurchasedLearningPathLearner } from '@/shared/types/purchased-learning-path.types';
import { mapLearnerToRow } from '../mappers';

const MOCK_LEARNER_ENROLLED: ApiPurchasedLearningPathLearner = {
  id: 'usr-001',
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@example.com',
  profile_photo: { url: 'https://cdn.example.com/avatar.jpg' },
  enrollment: {
    id: 'enr-001',
    status: 'in_progress',
    enrolled_at: '2026-07-01T00:00:00+00:00',
  },
};

const MOCK_LEARNER_NOT_ENROLLED: ApiPurchasedLearningPathLearner = {
  id: 'usr-002',
  first_name: 'Marie',
  last_name: 'Martin',
  email: 'marie.martin@example.com',
  profile_photo: null,
  enrollment: null,
};

describe('mapLearnerToRow', () => {
  it('mappe un apprenant inscrit avec enrollment non-null', () => {
    const result = mapLearnerToRow(MOCK_LEARNER_ENROLLED);

    expect(result).toEqual({
      id: 'usr-001',
      fullName: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      enrollment: {
        id: 'enr-001',
        status: 'in_progress',
        enrolledAt: '2026-07-01T00:00:00+00:00',
      },
    });
  });

  it('mappe un apprenant non inscrit avec enrollment à null', () => {
    const result = mapLearnerToRow(MOCK_LEARNER_NOT_ENROLLED);

    expect(result.enrollment).toBeNull();
    expect(result.avatarUrl).toBeNull();
  });

  it('utilise id comme fullName si first_name et last_name sont vides', () => {
    const result = mapLearnerToRow({
      ...MOCK_LEARNER_ENROLLED,
      first_name: '',
      last_name: '',
    });

    expect(result.fullName).toBe('usr-001');
  });
});
