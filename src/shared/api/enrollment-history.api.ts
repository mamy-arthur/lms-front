import { apiGet } from '@/shared/lib/apiClient';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import type {
  EnrollmentAttemptDetailResponse,
  EnrollmentHistoryResponse,
} from '@/shared/types/enrollment-history.types';

// Platform sessions have a different token ability from learner/manager sessions.
function enrollmentPath(enrollmentId: string) {
  const role = useAuthStore.getState().role;
  const prefix = role === Role.EDITOR || role === Role.SUPER_ADMIN ? 'platform/' : '';
  return `${prefix}enrollments/${encodeURIComponent(enrollmentId)}`;
}

export const enrollmentHistoryApi = {
  history: (enrollmentId: string, page = 1, signal?: AbortSignal) =>
    apiGet<EnrollmentHistoryResponse>(
      `${enrollmentPath(enrollmentId)}/history`,
      { page, per_page: 20 },
      { signal },
    ),
  detail: (enrollmentId: string, attemptId: string, signal?: AbortSignal) =>
    apiGet<EnrollmentAttemptDetailResponse>(
      `${enrollmentPath(enrollmentId)}/history/attempts/${encodeURIComponent(attemptId)}`,
      undefined,
      { signal },
    ),
};
