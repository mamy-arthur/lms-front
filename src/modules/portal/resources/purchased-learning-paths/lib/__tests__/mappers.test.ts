import { mapToPurchasedLearningPath } from '../mappers';
import type { ApiPurchasedLearningPath } from '@/shared/types/purchased-learning-path.types';

const MOCK_PURCHASED: ApiPurchasedLearningPath = {
  id: 'aa0e8400-e29b-41d4-a716-446655440090',
  tenant_id: '660e8400-e29b-41d4-a716-446655440000',
  user_id: '660e8400-e29b-41d4-a716-446655440010',
  purchased: 5,
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
  it('mappe name, learningPathId et purchasedCredits, sans enrollments', () => {
    const result = mapToPurchasedLearningPath(MOCK_PURCHASED);

    expect(result).toEqual({
      id: MOCK_PURCHASED.id,
      tenantId: MOCK_PURCHASED.tenant_id,
      learningPathId: MOCK_PURCHASED.learning_path.id,
      name: 'Devenir chef de projet digital',
      purchasedCredits: 5,
      enrollments: [],
    });
  });
});
