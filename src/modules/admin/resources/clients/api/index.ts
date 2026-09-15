import { apiGet } from '@/shared/lib/apiClient';
import type { Client } from '../types';

interface ClientListResponse {
  data: Client[];
}

export const adminClientsApi = {
  /**
   * Clients du tenant courant. Le backend restreint la réponse au seul client
   * de l'appelant lorsqu'il est CLIENT_MANAGER, et ignore `tenantId` pour tout
   * appelant déjà rattaché à un tenant : seul un compte global peut en désigner un.
   */
  list: (tenantId?: string | null) =>
    apiGet<ClientListResponse>('platform/clients', tenantId ? { tenant_id: tenantId } : undefined),
};
