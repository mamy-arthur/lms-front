import { apiGet, apiPost, httpClient } from '@/shared/lib/apiClient';
import type { ApiMeEnrollmentsResponse } from '@/shared/types/enrollment.types';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type {
  ApiLearnerEvaluation,
  ApiPortalContentEntry,
  ApiPortalLearningPathSummary,
} from '@/shared/types/portal.types';

export const portalLearningPathsApi = {
  summary: (enrollmentId: string) =>
    apiGet<{ data: ApiPortalLearningPathSummary }>(`enrollments/${enrollmentId}/summary`),

  /**
   * Porté par l'inscription et non par le parcours : les compteurs de tentatives
   * appartiennent à l'inscription consultée. Un apprenant inscrit plusieurs fois
   * à la même formation verrait sinon les tentatives de sa dernière inscription.
   */
  learnerEvaluations: (enrollmentId: string) =>
    apiGet<{ data: ApiLearnerEvaluation[] }>(`enrollments/${enrollmentId}/evaluations`),
};

export const portalContentEntriesApi = {
  get: (enrollmentId: string, courseId: string, entryId: string) =>
    apiGet<{ data: ApiPortalContentEntry }>(
      `enrollments/${enrollmentId}/courses/${courseId}/entries/${entryId}`,
    ),

  markComplete: (enrollmentId: string, courseId: string, entryId: string): Promise<void> =>
    apiPost<void>(`enrollments/${enrollmentId}/courses/${courseId}/entries/${entryId}/complete`),
};

export interface ContentTimeSessionPayload {
  /** ISO 8601. */
  started_at: string;
  /** ISO 8601. */
  ended_at: string;
  /** Temps réellement actif, en secondes. Plafonné côté serveur à ended_at - started_at. */
  time_spent: number;
}

export const portalContentTimeApi = {
  /**
   * Enregistre une période de consultation. Idempotent sur `sessionId` : le même
   * identifiant est réémis à chaque sauvegarde périodique, et le serveur met la
   * ligne à jour plutôt que d'en créer une nouvelle.
   *
   * Passe par `httpClient` et non `apiPut` pour pouvoir poser `keepalive`, dont
   * l'envoi final a besoin quand la page est en train de se fermer. On n'utilise
   * pas `navigator.sendBeacon` : il ne permet pas de poser l'en-tête `X-Tenant-ID`
   * que le client HTTP injecte sur chaque requête.
   */
  record: async (
    enrollmentId: string,
    courseId: string,
    entryId: string,
    sessionId: string,
    payload: ContentTimeSessionPayload,
    options?: { keepalive?: boolean },
  ): Promise<void> => {
    await httpClient(
      `enrollments/${enrollmentId}/courses/${courseId}/entries/${entryId}/time-sessions/${sessionId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
        keepalive: options?.keepalive ?? false,
      },
    );
  },
};

export const evaluationAttemptsApi = {
  start: (enrollmentId: string, evaluationId: string) =>
    apiPost<{ data: ApiEvaluationAttempt }>(
      `enrollments/${enrollmentId}/evaluations/${evaluationId}/attempts`,
    ),

  answer: (attemptId: string, attemptQuizId: string, payload: Record<string, unknown>) =>
    apiPost<unknown>(`evaluation-attempts/${attemptId}/quizzes/${attemptQuizId}/answer`, payload),

  submit: (attemptId: string) =>
    apiPost<{ data: ApiEvaluationAttempt }>(`evaluation-attempts/${attemptId}/submit`),
};

export const meApi = {
  enrollments: (params?: {
    page?: number;
    per_page?: number;
    q?: string;
    status?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    category_id?: string;
  }) => apiGet<ApiMeEnrollmentsResponse>('me/enrollments', params as Record<string, unknown>),
};
