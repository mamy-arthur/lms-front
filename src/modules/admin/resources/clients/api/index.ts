import { apiGet } from '@/shared/lib/apiClient';
import type { Client } from '../types';

interface ClientListResponse {
  data: Client[];
}

export const adminClientsApi = {
  /**
   * Clients du tenant courant. Le backend restreint la réponse au seul client
   * de l'appelant lorsqu'il est CLIENT_MANAGER.
   */
  list: () => apiGet<ClientListResponse>('platform/clients'),
};
