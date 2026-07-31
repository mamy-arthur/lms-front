/**
 * @jest-environment node
 */

/**
 * Tests unitaires — purchasedLearningPathsApi
 *
 * On vérifie :
 *  - le bon endpoint / params sont appelés
 *  - la réponse (data + meta) est retournée telle quelle
 *  - les erreurs API sont propagées
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
}));

import { apiGet } from '@/shared/lib/apiClient';
import { purchasedLearningPathsApi } from '../purchased-learning-paths.api';
import type {
  ApiPurchasedLearningPath,
  ApiPurchasedLearningPathsResponse,
} from '@/shared/types/purchased-learning-path.types';

const mockApiGet = jest.mocked(apiGet);

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

const MOCK_RESPONSE: ApiPurchasedLearningPathsResponse = {
  data: [MOCK_PURCHASED],
  meta: { total: 42, page: 1, per_page: 20 },
};

describe('purchasedLearningPathsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list()', () => {
    it('appelle GET purchased-learning-paths sans params', async () => {
      mockApiGet.mockResolvedValue(MOCK_RESPONSE);

      await purchasedLearningPathsApi.list();

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('purchased-learning-paths', undefined);
    });

    it('passe page et per_page à apiGet', async () => {
      mockApiGet.mockResolvedValue(MOCK_RESPONSE);

      await purchasedLearningPathsApi.list({ page: 2, per_page: 25 });

      expect(mockApiGet).toHaveBeenCalledWith('purchased-learning-paths', {
        page: 2,
        per_page: 25,
      });
    });

    it('retourne data + meta tels quels', async () => {
      mockApiGet.mockResolvedValue(MOCK_RESPONSE);

      const result = await purchasedLearningPathsApi.list({ page: 1, per_page: 20 });

      expect(result).toEqual(MOCK_RESPONSE);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].purchased).toBe(5);
      expect(result.meta).toEqual({ total: 42, page: 1, per_page: 20 });
    });

    it('propage les erreurs API', async () => {
      mockApiGet.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));

      await expect(purchasedLearningPathsApi.list()).rejects.toMatchObject({ status: 403 });
    });
  });
});
