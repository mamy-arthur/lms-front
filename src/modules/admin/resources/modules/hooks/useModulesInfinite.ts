import { useInfiniteQuery } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import { normalizeModule } from '../types';

const PAGE_SIZE = 5;

interface Params {
  q?: string;
  category_ids?: string | null;
}

export const ADMIN_MODULES_INFINITE_QUERY_KEY = ['admin', 'modules', 'infinite'] as const;

export function useModulesInfinite(params: Params, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...ADMIN_MODULES_INFINITE_QUERY_KEY, params],
    queryFn: async ({ pageParam }) => {
      const res = await adminModulesApi.list({
        page: pageParam,
        per_page: PAGE_SIZE,
        q: params.q || undefined,
        category_ids: params.category_ids || undefined,
      });
      const items = res.data ?? [];
      return {
        data: items.map(normalizeModule),
        total: res.meta?.total ?? res.total ?? items.length,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled,
  });
}
