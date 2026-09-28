import { useQuery } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { clientDashboardApi, getAllClientDashboardStudents } from '../api';
import { normalizeClientStudent } from '../types';

export function useClientDashboardScope() {
  const tenantId = useTenantStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.role);
  const sessionId = useAuthStore((state) => state.sessionId);
  return {
    key: ['client-dashboard', tenantId ?? 'user-tenant', userId, role, sessionId] as const,
    enabled: Boolean(userId) && role === Role.CLIENT_MANAGER,
  };
}

export function useClientDashboardQuery() {
  const scope = useClientDashboardScope();
  const options = { enabled: scope.enabled, staleTime: 30_000, refetchOnMount: 'always' as const };
  const overview = useQuery({
    ...options,
    queryKey: [...scope.key, 'overview'],
    queryFn: async () => (await clientDashboardApi.overview()).data,
  });
  const students = useQuery({
    ...options,
    queryKey: [...scope.key, 'students'],
    queryFn: async ({ signal }) =>
      (await getAllClientDashboardStudents(signal)).map(normalizeClientStudent),
  });
  return { overview, students };
}
