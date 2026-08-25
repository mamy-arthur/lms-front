import { useQuery } from '@tanstack/react-query';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import type { ModuleSearchParams } from '../types';
import { normalizeModule } from '../types';

export function useModules(params?: ModuleSearchParams) {
  return useQuery({
    queryKey: competencyKeys.list(params ?? {}),
    queryFn: async () => {
      const res = await adminModulesApi.list({
        page: (params?.page ?? 0) + 1,
        per_page: params?.page_size ?? 25,
        q: params?.q,
        category_ids: params?.category || undefined,
        sort_by: params?.sort_by,
        sort_order: params?.sort_dir,
      });
      const items = res.data ?? [];
      return {
        data: items.map(normalizeModule),
        total: res.meta?.total ?? res.total ?? items.length,
      };
    },
    placeholderData: (prev) => prev,
  });
}
