/**
 * Tests unitaires — cartsApi
 *
 * On vérifie :
 *  - les bons endpoints sont appelés pour chaque méthode
 *  - les payloads sont transmis correctement
 *  - les réponses sont retournées telles quelles
 *  - les erreurs API sont propagées
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  httpClient: jest.fn(),
}));

import { apiGet, apiPost, apiPatch, httpClient } from '@/shared/lib/apiClient';
import { cartsApi } from '../carts.api';
import type { ApiCart, ApiCartResponse } from '@/shared/types/cart.types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockHttpClient = jest.mocked(httpClient);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CART_ITEM = {
  id: 'item-1',
  cart_id: 'cart-1',
  learning_path_id: 'lp-1',
  name: 'Devenir chef de projet',
  price: 149.99,
  quantity: 1,
  currency: 'EUR',
  created_at: '2026-07-27T10:00:00+00:00',
  updated_at: '2026-07-27T10:00:00+00:00',
};

const MOCK_CART: ApiCart = {
  id: 'cart-1',
  tenant_id: 'tenant-1',
  user_id: 'user-1',
  status: 'active',
  currency: 'EUR',
  total: 149.99,
  items: [MOCK_CART_ITEM],
  created_at: '2026-07-27T10:00:00+00:00',
  updated_at: '2026-07-27T10:00:00+00:00',
};

const MOCK_RESPONSE: ApiCartResponse = { data: MOCK_CART };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('cartsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getActive ───────────────────────────────────────────────────────────────

  describe('getActive()', () => {
    it('appelle GET carts', async () => {
      mockApiGet.mockResolvedValue(MOCK_RESPONSE);

      await cartsApi.getActive();

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('carts');
    });

    it('retourne le panier actif tel quel', async () => {
      mockApiGet.mockResolvedValue(MOCK_RESPONSE);

      const result = await cartsApi.getActive();

      expect(result).toEqual(MOCK_RESPONSE);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(149.99);
    });

    it('propage les erreurs API', async () => {
      mockApiGet.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));

      await expect(cartsApi.getActive()).rejects.toMatchObject({ status: 403 });
    });
  });

  // ── addItem ─────────────────────────────────────────────────────────────────

  describe('addItem(payload)', () => {
    it('appelle POST carts/items avec learning_path_id', async () => {
      mockApiPost.mockResolvedValue(MOCK_RESPONSE);

      await cartsApi.addItem({ learning_path_id: 'lp-1' });

      expect(mockApiPost).toHaveBeenCalledTimes(1);
      expect(mockApiPost).toHaveBeenCalledWith('carts/items', { learning_path_id: 'lp-1' });
    });

    it('retourne le panier mis à jour', async () => {
      mockApiPost.mockResolvedValue(MOCK_RESPONSE);

      const result = await cartsApi.addItem({ learning_path_id: 'lp-1' });

      expect(result.data.items[0].learning_path_id).toBe('lp-1');
    });

    it('propage les erreurs 409 (déjà dans le panier)', async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }));

      await expect(cartsApi.addItem({ learning_path_id: 'lp-1' })).rejects.toMatchObject({
        status: 409,
      });
    });

    it('propage les erreurs 422 (non vendable)', async () => {
      mockApiPost.mockRejectedValue(
        Object.assign(new Error('Unprocessable Content'), { status: 422 }),
      );

      await expect(cartsApi.addItem({ learning_path_id: 'lp-x' })).rejects.toMatchObject({
        status: 422,
      });
    });
  });

  // ── updateItem ──────────────────────────────────────────────────────────────

  describe('updateItem(itemId, payload)', () => {
    it('appelle PATCH carts/items/{id} avec delta +1', async () => {
      mockApiPatch.mockResolvedValue({
        data: {
          ...MOCK_CART,
          total: 299.98,
          items: [{ ...MOCK_CART_ITEM, quantity: 2 }],
        },
      });

      await cartsApi.updateItem('item-1', { delta: 1 });

      expect(mockApiPatch).toHaveBeenCalledWith('carts/items/item-1', { delta: 1 });
    });

    it('appelle PATCH carts/items/{id} avec delta -1', async () => {
      mockApiPatch.mockResolvedValue(MOCK_RESPONSE);

      await cartsApi.updateItem('item-1', { delta: -1 });

      expect(mockApiPatch).toHaveBeenCalledWith('carts/items/item-1', { delta: -1 });
    });

    it('retourne le panier recalculé', async () => {
      const updated = {
        data: {
          ...MOCK_CART,
          total: 299.98,
          items: [{ ...MOCK_CART_ITEM, quantity: 2 }],
        },
      };
      mockApiPatch.mockResolvedValue(updated);

      const result = await cartsApi.updateItem('item-1', { delta: 1 });

      expect(result.data.items[0].quantity).toBe(2);
      expect(result.data.total).toBe(299.98);
    });

    it('propage les erreurs 422 (quantité minimale)', async () => {
      mockApiPatch.mockRejectedValue(
        Object.assign(new Error('Unprocessable Content'), { status: 422 }),
      );

      await expect(cartsApi.updateItem('item-1', { delta: -1 })).rejects.toMatchObject({
        status: 422,
      });
    });

    it('propage les erreurs 404 (item introuvable)', async () => {
      mockApiPatch.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));

      await expect(cartsApi.updateItem('unknown', { delta: 1 })).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  // ── removeItem ──────────────────────────────────────────────────────────────

  describe('removeItem(itemId)', () => {
    it('appelle DELETE /api/v1/carts/items/{id} via httpClient', async () => {
      const emptyCart = { data: { ...MOCK_CART, total: 0, items: [] } };
      mockHttpClient.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        body: JSON.stringify(emptyCart),
        json: emptyCart,
      });

      await cartsApi.removeItem('item-1');

      expect(mockHttpClient).toHaveBeenCalledWith('/api/v1/carts/items/item-1', {
        method: 'DELETE',
      });
    });

    it('retourne le panier mis à jour depuis json', async () => {
      const emptyCart = { data: { ...MOCK_CART, total: 0, items: [] } };
      mockHttpClient.mockResolvedValue({
        status: 200,
        headers: new Headers(),
        body: JSON.stringify(emptyCart),
        json: emptyCart,
      });

      const result = await cartsApi.removeItem('item-1');

      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('propage les erreurs 404', async () => {
      mockHttpClient.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));

      await expect(cartsApi.removeItem('unknown')).rejects.toMatchObject({ status: 404 });
    });
  });
});
