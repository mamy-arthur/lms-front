import { apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import type {
  ApiProgressionRule,
  CreateProgressionRulePayload,
  UpdateProgressionRulePayload,
} from '@/shared/types/progression-rule.types';

export const progressionRulesApi = {
  list: (learningPathId: string) =>
    apiGet<{ data: ApiProgressionRule[] }>(
      `platform/learning-paths/${learningPathId}/progression-rules`,
    ),

  create: (learningPathId: string, payload: CreateProgressionRulePayload) =>
    apiPost<{ data: ApiProgressionRule }>(
      `platform/learning-paths/${learningPathId}/progression-rules`,
      payload,
    ),

  update: (ruleId: string, payload: UpdateProgressionRulePayload) =>
    apiPatch<{ data: ApiProgressionRule }>(`platform/progression-rules/${ruleId}`, payload),

  deactivate: (ruleId: string) =>
    apiPatch<{ data: ApiProgressionRule }>(`platform/progression-rules/${ruleId}/deactivate`, {}),
};
