import { useQuery } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import type {
  DashboardEnrollmentsParams,
  DashboardFormationsParams,
} from '@/shared/types/dashboard.types';
import { editorDashboardApi } from '../api';
import {
  normalizeDashboardEnrollment,
  normalizeDashboardFormation,
  normalizeDashboardOverview,
} from '../types';

const isSameScope = (previousKey: readonly unknown[], scopeKey: readonly unknown[]) =>
  scopeKey.every((part, index) => previousKey[index] === part);

export function useDashboardScope() {
  return useUserQueryScope('editor-dashboard', [Role.EDITOR, Role.SUPER_ADMIN]);
}

export function useEditorDashboardOverviewQuery() {
  const scope = useDashboardScope();
  return useQuery({
    queryKey: [...scope.key, 'overview'],
    queryFn: async ({ signal }) =>
      normalizeDashboardOverview((await editorDashboardApi.overview(signal)).data),
    enabled: scope.enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
    placeholderData: () => undefined,
  });
}

export function useEditorDashboardFormationsQuery(params: DashboardFormationsParams) {
  const scope = useDashboardScope();
  return useQuery({
    queryKey: [...scope.key, 'formations', params],
    queryFn: async ({ signal }) => {
      const response = await editorDashboardApi.formations(params, signal);
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

export function useFormationEnrollmentsQuery(
  formationId: string,
  params: DashboardEnrollmentsParams,
) {
  const scope = useDashboardScope();
  return useQuery({
    queryKey: [...scope.key, 'enrollments', formationId, params],
    queryFn: async ({ signal }) => {
      const response = await editorDashboardApi.enrollments(formationId, params, signal);
      return { enrollments: response.data.map(normalizeDashboardEnrollment), meta: response.meta };
    },
    enabled: scope.enabled && Boolean(formationId),
    staleTime: 30_000,
    refetchOnMount: 'always',
    // Never display another formation, filter or identity while the new request is pending.
    placeholderData: () => undefined,
  });
}
