import { useQuery } from '@tanstack/react-query';
import { adminModulesApi } from '../api';

export const moduleOverviewQueryKey = (moduleId: string) =>
  ['admin', 'modules', 'overview', moduleId] as const;

export function useModuleOverview(moduleId: string) {
  return useQuery({
    queryKey: moduleOverviewQueryKey(moduleId),
    queryFn: () => adminModulesApi.getOverview(moduleId).then((r) => r.data),
    staleTime: 60_000,
  });
}
