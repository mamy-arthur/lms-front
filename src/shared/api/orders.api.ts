import { apiPost } from '@/shared/lib/apiClient';
import type { ApiOrderResponse, CreateOrderPayload } from '@/shared/types/order.types';

/**
 * Commandes client — routes /orders
 * Authentification : token tenant (ability:tenant:{id})
 * Authorization : Gate manage-cart (CLIENT_MANAGER)
 */
export const ordersApi = {
  create: (data: CreateOrderPayload) => apiPost<ApiOrderResponse>('orders', data),
};
