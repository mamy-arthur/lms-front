import { apiGet } from '@/shared/lib/apiClient';
import type { Client } from '../types';

interface ClientListResponse {
  data: Client[];
}

interface ClientNameResponse extends ClientListResponse {
  meta: { name_slug: string };
}

export const adminClientsApi = {
  resolveName: (name: string, tenantId?: string | null) =>
    apiGet<ClientNameResponse>('platform/clients', {
      name,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    }),

  /**
   * Clients du tenant courant. Le backend restreint la réponse au seul client
   * de l'appelant lorsqu'il est CLIENT_MANAGER, et ignore `tenantId` pour tout
   * appelant déjà rattaché à un tenant : seul un compte global peut en désigner un.
   */
  list: (tenantId?: string | null) =>
    apiGet<ClientListResponse>('platform/clients', tenantId ? { tenant_id: tenantId } : undefined),
};
