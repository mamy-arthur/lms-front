import { apiGet, apiPost, apiPatch, httpClient } from '@/shared/lib/apiClient';
import type {
  AddCartItemPayload,
  ApiCartResponse,
  UpdateCartItemPayload,
} from '@/shared/types/cart.types';

/**
 * Panier client — routes /carts
 * Authentification : token tenant (ability:tenant:{id})
 * Authorization : Gate manage-cart (CLIENT_MANAGER)
 */
export const cartsApi = {
  getActive: () => apiGet<ApiCartResponse>('carts'),

  addItem: (data: AddCartItemPayload) => apiPost<ApiCartResponse>('carts/items', data),

  updateItem: (itemId: string, data: UpdateCartItemPayload) =>
    apiPatch<ApiCartResponse>(`carts/items/${itemId}`, data),

  removeItem: async (itemId: string): Promise<ApiCartResponse> => {
    const { json } = await httpClient(`/api/v1/carts/items/${itemId}`, { method: 'DELETE' });
    return json as ApiCartResponse;
  },
};
