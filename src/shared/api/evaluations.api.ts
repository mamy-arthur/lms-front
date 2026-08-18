import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiEvaluation {
  id: string;
  learning_path_id: string;
  title: string;
  type: 'PARTIAL' | 'FINAL';
  question_bank_ids: string[];
  question_count: number;
  max_attempts: number | null;
  position: number;
  location_x: number | null;
  location_y: number | null;
  preceding_competency_id: string | null;
  is_published: boolean;
  pool_size: number | null;
  pool_insufficient: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEvaluationPayload {
  title: string;
  type: 'PARTIAL' | 'FINAL';
  question_bank_ids: string[];
  question_count: number;
  max_attempts?: number | null;
  location_x?: number | null;
  location_y?: number | null;
  is_published?: boolean;
}

export type UpdateEvaluationPayload = Partial<Omit<CreateEvaluationPayload, 'type'>> & {
  is_published?: boolean;
};

// ─── API client ───────────────────────────────────────────────────────────────

export const evaluationsApi = {
  list: (learningPathId: string) =>
    apiGet<{ data: ApiEvaluation[] }>(`platform/learning-paths/${learningPathId}/evaluations`),

  create: (learningPathId: string, data: CreateEvaluationPayload) =>
    apiPost<{ data: ApiEvaluation }>(
      `platform/learning-paths/${learningPathId}/evaluations`,
      data as unknown as Record<string, unknown>,
    ),

  getById: (id: string) => apiGet<{ data: ApiEvaluation }>(`platform/evaluations/${id}`),

  update: (id: string, data: UpdateEvaluationPayload) =>
    apiPatch<{ data: ApiEvaluation }>(
      `platform/evaluations/${id}`,
      data as unknown as Record<string, unknown>,
    ),

  delete: (id: string) => apiDelete(`platform/evaluations/${id}`),
};
