import { useQuery } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import type { DashboardFormationsParams } from '@/shared/types/dashboard.types';
import { editorDashboardApi } from '../api';
import { normalizeDashboardFormation, normalizeDashboardOverview } from '../types';

const isSameScope = (previousKey: readonly unknown[], scopeKey: readonly unknown[]) =>
  scopeKey.every((part, index) => previousKey[index] === part);

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
    // Conserve la page affichée pendant un changement de filtre, jamais entre deux identités.
    placeholderData: (previous, previousQuery) =>
      previousQuery && isSameScope(previousQuery.queryKey, scope.key) ? previous : undefined,
  });
}
