import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressionRulesApi } from '@/shared/api/progression-rules.api';
import { progressionRuleKeys } from '@/shared/queries/keys';
import type { UpdateProgressionRulePayload } from '@/shared/types/progression-rule.types';

interface Variables {
  ruleId: string;
  learningPathId: string;
  payload: UpdateProgressionRulePayload;
}

export function usePatchProgressionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, payload }: Variables) =>
      progressionRulesApi.update(ruleId, payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: progressionRuleKeys.listByLearningPath(variables.learningPathId),
      });
    },
  });
}
