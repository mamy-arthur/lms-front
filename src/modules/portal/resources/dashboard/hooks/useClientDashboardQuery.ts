import { useQuery } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import { clientDashboardApi, getAllClientDashboardStudents } from '../api';
import { normalizeClientStudent } from '../types';

export function useClientDashboardScope() {
  return useUserQueryScope('client-dashboard', [Role.CLIENT_MANAGER]);
}

export function useClientDashboardQuery() {
  const scope = useClientDashboardScope();
  const options = {
    enabled: scope.enabled,
    staleTime: 30_000,
    refetchOnMount: 'always' as const,
    // Never inherit global keepPreviousData across identities or sessions.
    placeholderData: () => undefined,
  };
  const overview = useQuery({
    ...options,
    queryKey: [...scope.key, 'overview', 'enrollments'],
    queryFn: async ({ signal }) => (await clientDashboardApi.overview(signal)).data,
  });
  const students = useQuery({
    ...options,
    queryKey: [...scope.key, 'students'],
    queryFn: async ({ signal }) =>
      (await getAllClientDashboardStudents(signal)).map(normalizeClientStudent),
  });
  return { overview, students };
}
