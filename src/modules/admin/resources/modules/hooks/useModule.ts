import { useQuery } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import { normalizeModule } from '../types';

export const moduleQueryKey = (idnumber: string) =>
  ['admin', 'modules', 'detail', idnumber] as const;

/**
 * Fetches full competency details for a single module.
 * Used when opening the edit drawer to ensure `courseIds` is populated
 * (the list endpoint omits them for performance).
 */
export function useModule(idnumber: string | undefined, id: string | undefined) {
  return useQuery({
    queryKey: idnumber
      ? moduleQueryKey(idnumber)
      : (['admin', 'modules', 'detail', '__none__'] as const),
    queryFn: async () => {
      const res = await adminModulesApi.getById(id!);
      // Backend returns { data: {...} }; guard against direct-object responses
      const raw = (res.data ?? res) as import('../types').CompetencyApiResponse;
      return normalizeModule(raw);
    },
    enabled: !!idnumber && !!id,
    staleTime: 2 * 60 * 1000,
  });
}
