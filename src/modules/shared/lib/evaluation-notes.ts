export const EVALUATION_SUCCESS_THRESHOLD = 50;

export interface EvaluationItem {
  id: string;
  label: string;
  pointsEarned: number;
  pointsMax: number;
}

export interface EvaluationNote {
  id: string;
  traineeId: string;
  traineeName: string;
  clientId: string;
  clientName: string;
  formationId: string;
  formationName: string;
  formationCoverImage?: string;
  formationCategory?: string;
  evaluations: EvaluationItem[];
}

export interface ScoreSummary {
  pointsEarned: number;
  pointsMax: number;
  percentage: number;
  isSuccess: boolean;
}

export interface EvaluationDefinition {
  id: string;
  label: string;
}

// ─── API-first types (formations-as-resource) ─────────────────────────────────

/**
 * Lightweight formation summary returned by the list endpoint.
 * Stats are computed server-side — no client-side grouping needed.
 */
export interface FormationSummary {
  id: string;
  name: string;
  coverImage?: string;
  category?: string;
  /** Total number of trainees enrolled in this formation. */
  traineeCount: number;
  /** Total number of distinct evaluations (columns) for this formation. */
  evaluationCount: number;
  /** Average score across all trainees, expressed as a 0–100 percentage. */
  avgScore: number;
  /** Percentage of trainees who reached the success threshold. */
  successRate: number;
}

/**
 * Full formation detail returned by the single-resource endpoint.
 * Used by the drawer to display the notes table.
 */
export interface FormationDetail {
  id: string;
  name: string;
  coverImage?: string;
  category?: string;
  evaluations: EvaluationDefinition[];
  rows: EvaluationNote[];
}

export interface FormationSummaryListResponse {
  data: FormationSummary[];
  /** Client options available for filtering — populated server-side. */
  clients?: Array<{ id: string; name: string }>;
  total?: number;
}

export interface FormationDetailResponse {
  data: FormationDetail;
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function computeScoreSummary(pointsEarned: number, pointsMax: number): ScoreSummary {
  const safeEarned = Math.max(0, toNumber(pointsEarned));
  const safeMax = Math.max(0, toNumber(pointsMax));
  const percentage = safeMax > 0 ? Math.round((safeEarned / safeMax) * 100) : 0;

  return {
    pointsEarned: safeEarned,
    pointsMax: safeMax,
    percentage,
    isSuccess: percentage >= EVALUATION_SUCCESS_THRESHOLD,
  };
}
