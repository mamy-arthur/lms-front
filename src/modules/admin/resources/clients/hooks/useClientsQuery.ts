import { useQuery } from '@tanstack/react-query';
import { adminClientsApi } from '../api';
import { normalizeClient } from '../types';

export const ADMIN_CLIENTS_QUERY_KEY = ['admin', 'clients'] as const;

export function useClientsQuery(enabled = true, tenantId?: string | null) {
  return useQuery({
    queryKey: [...ADMIN_CLIENTS_QUERY_KEY, tenantId ?? null],
    queryFn: async () => {
      const res = await adminClientsApi.list(tenantId);
      return res.data.map((c) => normalizeClient(c));
    },
    enabled,
  });
}
