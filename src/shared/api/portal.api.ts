import { apiGet, apiPost } from '@/shared/lib/apiClient';
import type {
  ApiPortalLearningPathSummary,
  ApiPortalContentEntry,
} from '@/shared/types/portal.types';
import type { ApiMeEnrollmentsResponse } from '@/shared/types/enrollment.types';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';

export const portalLearningPathsApi = {
  summary: (id: string) =>
    apiGet<{ data: ApiPortalLearningPathSummary }>(`learning-paths/${id}/summary`),
};

export const portalContentEntriesApi = {
  get: (learningPathId: string, courseId: string, entryId: string) =>
    apiGet<{ data: ApiPortalContentEntry }>(
      `learning-paths/${learningPathId}/courses/${courseId}/entries/${entryId}`,
    ),
};

export const evaluationAttemptsApi = {
  start: (learningPathId: string, evaluationId: string) =>
    apiPost<{ data: ApiEvaluationAttempt }>(
      `learning-paths/${learningPathId}/evaluations/${evaluationId}/attempts`,
    ),

  answer: (attemptId: string, attemptQuizId: string, payload: Record<string, unknown>) =>
    apiPost<unknown>(`evaluation-attempts/${attemptId}/quizzes/${attemptQuizId}/answer`, payload),

  submit: (attemptId: string) =>
    apiPost<{ data: ApiEvaluationAttempt }>(`evaluation-attempts/${attemptId}/submit`),
};

export const meApi = {
  enrollments: (params?: { page?: number; per_page?: number }) =>
    apiGet<ApiMeEnrollmentsResponse>('me/enrollments', params as Record<string, unknown>),
};
