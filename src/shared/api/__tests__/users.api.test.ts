/**
 * Tests unitaires — usersApi
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
}));

import { apiGet } from '@/shared/lib/apiClient';
import { usersApi } from '../users.api';
import type { ApiUsersListResponse } from '@/shared/types/user.types';

const mockApiGet = jest.mocked(apiGet);

const MOCK_RESPONSE: ApiUsersListResponse = {
  data: [
    {
      id: '660e8400-e29b-41d4-a716-446655440020',
      first_name: 'Alice',
      last_name: 'Martin',
      full_name: 'Alice Martin',
      email: 'alice@acme.local',
      role: 'TRAINEE',
      profile_photo: {
        id: 'aa0e8400-e29b-41d4-a716-446655440300',
        url: 'https://cdn.example.com/media/photo.png',
        mime_type: 'image/png',
      },
    },
  ],
  total: 42,
};

describe('usersApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list()', () => {
    it('passe role, page et page_size à apiGet', async () => {
      mockApiGet.mockResolvedValue(MOCK_RESPONSE);

      await usersApi.list({ role: 'TRAINEE', page: 1, page_size: 100 });

      expect(mockApiGet).toHaveBeenCalledWith('users', {
        role: 'TRAINEE',
        page: 1,
        page_size: 100,
      });
    });

    it('retourne data + total tels quels', async () => {
      mockApiGet.mockResolvedValue(MOCK_RESPONSE);

      const result = await usersApi.list({ role: 'TRAINEE' });

      expect(result).toEqual(MOCK_RESPONSE);
      expect(result.data[0].full_name).toBe('Alice Martin');
      expect(result.total).toBe(42);
    });
  });
});
