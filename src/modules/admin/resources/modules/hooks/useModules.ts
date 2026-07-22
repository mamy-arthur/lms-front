import { useQuery } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import type { ModuleSearchParams } from '../types';
import { normalizeModule } from '../types';

export const ADMIN_MODULES_QUERY_KEY = ['admin', 'modules'] as const;

export function useModules(params?: ModuleSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_MODULES_QUERY_KEY, params],
    queryFn: async () => {
      try {
        const res = await adminModulesApi.list({
          page: (params?.page ?? 0) + 1,
          per_page: params?.page_size ?? 25,
          q: params?.q,
          sort_by: params?.sort_by,
          sort_order: params?.sort_dir,
        });
        const items = res.data ?? [];
        console.debug('[useModules] raw response:', res, 'items:', items.length);
        return {
          data: items.map(normalizeModule),
          total: res.meta?.total ?? res.total ?? items.length,
        };
      } catch (err) {
        console.error('[useModules] API error:', err);
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });
}
