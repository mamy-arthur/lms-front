import type {
  ApiExecutionNode,
  ApiExecutionSnapshot,
  ApiExecutionVisit,
  EnrollmentExecutionStatus,
} from './progression.types';

// ─────────────────────────────────────────────────────────────────────────────
// Portal Summary — navigation skeleton returned by GET /enrollments/{enrollmentId}/summary
//
// La réponse décrit la définition d'exécution gelée à l'inscription : chaque
// module/évaluation porte les champs de `ApiExecutionNode` et la racine embarque
// le snapshot complet sous `execution`. Le catalogue vivant ne fournit que des
// libellés ; il ne décide ni de l'ordre, ni de l'appartenance, ni des droits.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Projection d'exécution fusionnée dans les nœuds du résumé. `progress`,
 * `coverage`, `id` et `title` en sont exclus : le résumé les réécrit au format
 * `{percent, completed, total}` et sous les noms déjà utilisés par le portail.
 */
export type ApiPortalExecutionProjection = Omit<
  ApiExecutionNode,
  'progress' | 'coverage' | 'id' | 'title'
>;

export type ApiPortalEvalSummary = {
  id: string;
  title: string;
  accessible: boolean;
  completed: boolean;
  score: number | null;
  coverage: ApiProgressCounts;
  progress: ApiProgressCounts;
} & ApiPortalExecutionProjection;

export interface ApiPortalSummaryEntry {
  id: string;
  title: string | null;
  /** Complété DANS la visite courante. */
  completed: boolean;
  /** Preuve historique : n'autorise pas à sauter une visite obligatoire. */
  historical_completed: boolean;
}

export interface ApiPortalSummarySection {
  /** `null` : la définition fige l'ordre des contenus, pas l'identité des sections. */
  id: string | null;
  name: string | null;
  frozen: boolean;
  content_entries: ApiPortalSummaryEntry[];
  progress: ApiProgressCounts;
  coverage: ApiProgressCounts;
}

export interface ApiPortalSummaryCourse {
  id: string;
  /** Libellé du catalogue vivant, `null` si le cours a disparu depuis l'inscription. */
  name: string | null;
  sections: ApiPortalSummarySection[];
  accessible: boolean;
  actionable: boolean;
  progress: ApiProgressCounts;
  coverage: ApiProgressCounts;
}

export type ApiPortalSummaryModule = {
  id: string;
  name: string;
  accessible: boolean;
  progress: ApiProgressCounts;
  coverage: ApiProgressCounts;
  courses: ApiPortalSummaryCourse[];
  evaluation: ApiPortalEvalSummary | null;
} & ApiPortalExecutionProjection;

export interface ApiProgressCounts {
  percent: number;
  completed: number;
  total: number;
}

export interface ApiPortalLearningPathSummary {
  id: string;
  name: string;
  progress: ApiProgressCounts;
  modules: ApiPortalSummaryModule[];
  /** Alias de `final_evaluations[0]`, conservé par le backend pour compatibilité. */
  final_evaluation: ApiPortalEvalSummary | null;
  definition_id: string;
  state_revision: number;
  status: EnrollmentExecutionStatus;
  current_execution: ApiExecutionVisit | null;
  /** Unités historiques distinctes — 100 % de couverture n'implique pas la réussite. */
  coverage: ApiProgressCounts;
  completed_counts: { historical: number; active_route: number };
  /** Toutes les évaluations finales figées. */
  final_evaluations: ApiPortalEvalSummary[];
  execution: ApiExecutionSnapshot;
}

// ─────────────────────────────────────────────────────────────────────────────
// Learner evaluation — returned by GET /learning-paths/{id}/evaluations (portal)
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiLearnerEvaluation {
  id: string;
  title: string;
  type: string;
  question_count: number;
  allow_review: boolean;
  max_attempts: number | null;
  attempts_used: number;
  /** null = unlimited */
  attempts_remaining: number | null;
  last_attempt_status: 'in_progress' | 'completed' | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal Content Entry — full entry returned by GET /courses/{courseId}/entries/{entryId}
// ─────────────────────────────────────────────────────────────────────────────

export type PortalModuleType = 'page' | 'file' | 'folder' | 'url' | 'media' | 'scorm';

export interface ApiPortalContentEntry {
  id: string;
  content_type_id: string;
  /** ContentType module_type value from backend. */
  module_type: PortalModuleType | null;
  /** Field values keyed by field name (resolved, media/richtext included). */
  data: Record<string, unknown>;
  /** Maps field_name → field_type ('text' | 'richtext' | 'media' | 'url' | ...). */
  field_types: Record<string, string>;
  is_published: boolean;
}
