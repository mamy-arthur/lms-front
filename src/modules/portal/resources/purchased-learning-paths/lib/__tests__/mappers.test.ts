import type { ApiPurchasedLearningPath } from '@/shared/types/purchased-learning-path.types';
import { mapToPurchasedLearningPath } from '../mappers';

const MOCK_PURCHASED: ApiPurchasedLearningPath = {
  id: 'aa0e8400-e29b-41d4-a716-446655440090',
  tenant_id: '660e8400-e29b-41d4-a716-446655440000',
  user_id: '660e8400-e29b-41d4-a716-446655440010',
  purchased: 12,
  used: 5,
  credits_available: 7,
  enrollments_not_started_count: 3,
  enrollments_in_progress_count: 2,
  enrollments_completed_count: 0,
  enrollments_expired_count: 0,
  learning_path: {
    id: '660e8400-e29b-41d4-a716-446655440060',
    name: 'Devenir chef de projet digital',
    image: {
      id: '770e8400-e29b-41d4-a716-446655440070',
      url: 'https://cdn.example.com/media/cover.jpg',
      mime_type: 'image/jpeg',
    },
  },
  created_at: '2026-07-28T10:00:00+00:00',
  updated_at: '2026-07-28T10:00:00+00:00',
};

describe('mapToPurchasedLearningPath', () => {
  it("mappe les champs name, crédits et compteurs d'enrollments depuis l'API", () => {
    const result = mapToPurchasedLearningPath(MOCK_PURCHASED);

    expect(result).toEqual({
      id: MOCK_PURCHASED.id,
      tenantId: MOCK_PURCHASED.tenant_id,
      learningPathId: MOCK_PURCHASED.learning_path.id,
      name: 'Devenir chef de projet digital',
      imageUrl: 'https://cdn.example.com/media/cover.jpg',
      creditsTotal: 12,
      creditsUsed: 5,
      creditsAvailable: 7,
      enrollmentsNotStartedCount: 3,
      enrollmentsInProgressCount: 2,
      enrollmentsCompletedCount: 0,
      enrollmentsExpiredCount: 0,
    });
  });
});
