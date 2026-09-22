import { useQuery } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type { DashboardFormationsParams } from '@/shared/types/dashboard.types';
import { editorDashboardApi } from '../api';
import { normalizeDashboardFormation, normalizeDashboardOverview } from '../types';

function useDashboardScope() {
  const tenantId = useTenantStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.role);
  const sessionId = useAuthStore((state) => state.sessionId);
  return {
    key: ['editor-dashboard', tenantId ?? 'user-tenant', userId, role, sessionId] as const,
    enabled: Boolean(userId) && (role === Role.EDITOR || role === Role.SUPER_ADMIN),
  };
}

export function useEditorDashboardOverviewQuery() {
  const scope = useDashboardScope();
  return useQuery({
    queryKey: [...scope.key, 'overview'],
    queryFn: async () => normalizeDashboardOverview((await editorDashboardApi.overview()).data),
    enabled: scope.enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}

export function useEditorDashboardFormationsQuery(params: DashboardFormationsParams) {
  const scope = useDashboardScope();
  return useQuery({
    queryKey: [...scope.key, 'formations', params],
    queryFn: async () => {
      const response = await editorDashboardApi.formations(params);
      return { formations: response.data.map(normalizeDashboardFormation), meta: response.meta };
    },
    enabled: scope.enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });
}
