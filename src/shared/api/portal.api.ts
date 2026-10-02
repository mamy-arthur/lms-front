import { apiGet, apiPost, httpClient } from '@/shared/lib/apiClient';
import type { ApiMeEnrollmentsResponse } from '@/shared/types/enrollment.types';
import type {
  ApiEvaluationAttempt,
  SubmittableCompletionReason,
} from '@/shared/types/evaluation-attempt.types';
import type {
  ApiLearnerEvaluation,
  ApiPortalContentEntry,
  ApiPortalLearningPathSummary,
} from '@/shared/types/portal.types';
import type {
  ApiExecutionSnapshot,
  ExecutionMutationContext,
} from '@/shared/types/progression.types';

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

  /**
   * `context` porte la visite et la révision lue : le serveur refuse la preuve
   * sans elles (422) et rejette une visite périmée (409).
   */
  markComplete: (
    enrollmentId: string,
    competencyId: string,
    courseId: string,
    entryId: string,
    context: ExecutionMutationContext,
  ): Promise<{ data: ApiExecutionSnapshot }> =>
    apiPost<{ data: ApiExecutionSnapshot }, ExecutionMutationContext>(
      `enrollments/${enrollmentId}/competencies/${competencyId}/courses/${courseId}/entries/${entryId}/complete`,
      context,
    ),
};

export interface ContentTimeSessionPayload extends ExecutionMutationContext {
  /**
   * Module (compétence) depuis lequel le contenu est consulté. Un même contenu
   * pourra être atteint depuis plusieurs modules : le couple inscription +
   * contenu ne suffit plus à situer la période.
   */
  competency_id: string;
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

export interface EvaluationAttemptResponse {
  data: ApiEvaluationAttempt;
  execution?: ApiExecutionSnapshot;
}

export const evaluationAttemptsApi = {
  session: (
    enrollmentId: string,
    evaluationId: string,
    context: {
      node_execution_id: string;
      page_session_id: string;
    },
  ) =>
    apiPost<{ data: ApiEvaluationAttempt | null; execution?: ApiExecutionSnapshot }>(
      `enrollments/${enrollmentId}/evaluations/${evaluationId}/attempts/session`,
      context,
    ),

  get: (attemptId: string) => apiGet<EvaluationAttemptResponse>(`evaluation-attempts/${attemptId}`),

  start: (
    enrollmentId: string,
    evaluationId: string,
    context: ExecutionMutationContext & { page_session_id: string },
  ) =>
    apiPost<EvaluationAttemptResponse>(
      `enrollments/${enrollmentId}/evaluations/${evaluationId}/attempts`,
      context,
    ),

  // Answer et submit dérivent leur contexte de la tentative persistée côté
  // serveur : le client ne doit jamais leur imposer une visite.
  answer: (attemptId: string, attemptQuizId: string, payload: Record<string, unknown>) =>
    apiPost<EvaluationAttemptResponse>(
      `evaluation-attempts/${attemptId}/quizzes/${attemptQuizId}/answer`,
      payload,
    ),

  submit: (attemptId: string, body?: { reason: SubmittableCompletionReason }) =>
    apiPost<EvaluationAttemptResponse>(`evaluation-attempts/${attemptId}/submit`, body),
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
