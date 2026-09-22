import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { adminClientsApi } from '../api';
import { normalizeClient } from '../types';
import { ADMIN_CLIENTS_QUERY_KEY } from './useClientsQuery';

export function useClientNameQuery(name: string, tenantId: string | null, enabled: boolean) {
  const debouncedName = useDebounce(name);
  const isDebouncing = name !== debouncedName;
  const query = useQuery({
    queryKey: [...ADMIN_CLIENTS_QUERY_KEY, 'resolve-name', tenantId, debouncedName],
    queryFn: async () => {
      const response = await adminClientsApi.resolveName(debouncedName, tenantId);
      if (!response.meta?.name_slug) throw new Error('Canonical client name unavailable');
      return { slug: response.meta.name_slug, clients: response.data.map(normalizeClient) };
    },
    enabled: enabled && debouncedName !== '' && !isDebouncing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    data: isDebouncing ? undefined : query.data,
    isResolving: isDebouncing || query.isPending,
  };
}
