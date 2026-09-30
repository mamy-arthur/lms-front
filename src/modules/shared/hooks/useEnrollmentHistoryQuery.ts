'use client';

import { useQuery } from '@tanstack/react-query';
import { Role } from '@/shared/constants/roles';
import { useUserQueryScope } from '@/shared/hooks/useUserQueryScope';
import { enrollmentHistoryApi } from '@/shared/api/enrollment-history.api';

// UUIDs and opaque resource IDs only; never request an empty or malformed path.
const isValidId = (id: string) => /^[a-zA-Z0-9_-]+$/.test(id);

export function useEnrollmentHistoryScope() {
  return useUserQueryScope('enrollment-history', [
    Role.EDITOR,
    Role.SUPER_ADMIN,
    Role.CLIENT_MANAGER,
    Role.TRAINEE,
  ]);
}

export function useEnrollmentHistoryQuery(enrollmentId: string, page = 1) {
  const scope = useEnrollmentHistoryScope();
  const enabled = scope.enabled && isValidId(enrollmentId) && Number.isInteger(page) && page > 0;
  const query = useQuery({
    queryKey: [...scope.key, enrollmentId, 'list', page, 20],
    queryFn: ({ signal }) => enrollmentHistoryApi.history(enrollmentId, page, signal),
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
    // Do not inherit global keepPreviousData defaults, including across identities.
    placeholderData: () => undefined,
  });
  return { ...query, enabled };
}

export function useEnrollmentAttemptDetailQuery(
  enrollmentId: string,
  attemptId: string,
  expanded = false,
) {
  const scope = useEnrollmentHistoryScope();
  const enabled = scope.enabled && isValidId(enrollmentId) && isValidId(attemptId) && expanded;
  const query = useQuery({
    queryKey: [...scope.key, enrollmentId, 'attempt', attemptId],
    queryFn: async ({ signal }) =>
      (await enrollmentHistoryApi.detail(enrollmentId, attemptId, signal)).data,
    enabled,
    staleTime: 30_000,
    refetchOnMount: 'always',
    placeholderData: () => undefined,
  });
  return { ...query, enabled };
}
