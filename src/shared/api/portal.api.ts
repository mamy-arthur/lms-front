import { apiGet, apiPost } from '@/shared/lib/apiClient';
import { httpClient } from '@/shared/lib/apiClient';
import type {
  ApiPortalLearningPathSummary,
  ApiPortalContentEntry,
  ApiLearnerEvaluation,
} from '@/shared/types/portal.types';
import type { ApiMeEnrollmentsResponse } from '@/shared/types/enrollment.types';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';

export const portalLearningPathsApi = {
  summary: (enrollmentId: string) =>
    apiGet<{ data: ApiPortalLearningPathSummary }>(`enrollments/${enrollmentId}/summary`),

  learnerEvaluations: (learningPathId: string) =>
    apiGet<{ data: ApiLearnerEvaluation[] }>(`learning-paths/${learningPathId}/evaluations`),
};

export const portalContentEntriesApi = {
  get: (enrollmentId: string, courseId: string, entryId: string) =>
    apiGet<{ data: ApiPortalContentEntry }>(
      `enrollments/${enrollmentId}/courses/${courseId}/entries/${entryId}`,
    ),

  markComplete: (enrollmentId: string, courseId: string, entryId: string): Promise<void> =>
    httpClient(
      `/api/v1/enrollments/${enrollmentId}/courses/${courseId}/entries/${entryId}/complete`,
      { method: 'POST' },
    ).then(() => undefined),
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
