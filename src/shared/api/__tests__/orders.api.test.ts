/**
 * Tests unitaires — ordersApi
 *
 * On vérifie :
 *  - le bon endpoint est appelé
 *  - le payload payment_method est transmis
 *  - la réponse est retournée telle quelle
 *  - les erreurs API sont propagées
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiPost: jest.fn(),
}));

import { apiPost } from '@/shared/lib/apiClient';
import { ordersApi } from '../orders.api';
import type { ApiOrderResponse } from '@/shared/types/order.types';

const mockApiPost = jest.mocked(apiPost);

const MOCK_RESPONSE: ApiOrderResponse = {
  data: {
    id: 'order-1',
    payment_method: 'cash',
    status: 'pending',
    created_at: '2026-07-28T10:00:00+00:00',
    updated_at: '2026-07-28T10:00:00+00:00',
  },
};

describe('ordersApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create(payload)', () => {
    it('appelle POST orders avec payment_method', async () => {
      mockApiPost.mockResolvedValue(MOCK_RESPONSE);

      await ordersApi.create({ payment_method: 'cash' });

      expect(mockApiPost).toHaveBeenCalledTimes(1);
      expect(mockApiPost).toHaveBeenCalledWith('orders', { payment_method: 'cash' });
    });

    it.each([
      ['cash' as const],
      ['card' as const],
      ['bank_transfer' as const],
    ])('accepte le mode de paiement %s', async (paymentMethod) => {
      mockApiPost.mockResolvedValue({
        data: { ...MOCK_RESPONSE.data, payment_method: paymentMethod },
      });

      await ordersApi.create({ payment_method: paymentMethod });

      expect(mockApiPost).toHaveBeenCalledWith('orders', { payment_method: paymentMethod });
    });

    it('retourne la commande créée telle quelle', async () => {
      mockApiPost.mockResolvedValue(MOCK_RESPONSE);

      const result = await ordersApi.create({ payment_method: 'card' });

      expect(result).toEqual(MOCK_RESPONSE);
      expect(result.data.id).toBe('order-1');
    });

    it('propage les erreurs 422', async () => {
      mockApiPost.mockRejectedValue(
        Object.assign(new Error('Unprocessable Content'), { status: 422 }),
      );

      await expect(ordersApi.create({ payment_method: 'cash' })).rejects.toMatchObject({
        status: 422,
      });
    });

    it('propage les erreurs 403', async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));

      await expect(ordersApi.create({ payment_method: 'cash' })).rejects.toMatchObject({
        status: 403,
      });
    });
  });
});
