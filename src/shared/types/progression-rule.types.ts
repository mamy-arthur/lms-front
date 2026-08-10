// ─── Node reference ───────────────────────────────────────────────────────────

export type ProgressionNodeType = 'module' | 'evaluation' | 'certificate';

export interface ProgressionNodeRef {
  type: ProgressionNodeType;
  id: string;
}

// ─── Condition ────────────────────────────────────────────────────────────────

export type ProgressionCondition =
  | { type: 'module_completed'; rule_type: 'all' | 'any' }
  | { type: 'evaluation_passed'; min_score_percentage: number }
  | { type: 'evaluation_completed' };

// ─── API response type ────────────────────────────────────────────────────────

export interface ApiProgressionRule {
  id: string;
  learning_path_id: string;
  source: ProgressionNodeRef;
  condition: ProgressionCondition;
  target_on_success: ProgressionNodeRef;
  target_on_failure: ProgressionNodeRef | null;
  max_attempts: number | null;
  target_on_exhausted: ProgressionNodeRef | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Mutation payloads ────────────────────────────────────────────────────────

export interface CreateProgressionRulePayload {
  source: ProgressionNodeRef;
  condition: ProgressionCondition;
  target_on_success: ProgressionNodeRef;
  target_on_failure?: ProgressionNodeRef | null;
  max_attempts?: number | null;
  target_on_exhausted?: ProgressionNodeRef | null;
}

export interface UpdateProgressionRulePayload {
  condition: ProgressionCondition;
  target_on_success: ProgressionNodeRef;
  target_on_failure?: ProgressionNodeRef | null;
  max_attempts?: number | null;
  target_on_exhausted?: ProgressionNodeRef | null;
}
