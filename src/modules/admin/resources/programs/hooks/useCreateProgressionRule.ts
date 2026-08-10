import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressionRulesApi } from '@/shared/api/progression-rules.api';
import { progressionRuleKeys } from '@/shared/queries/keys';
import type { CreateProgressionRulePayload } from '@/shared/types/progression-rule.types';

interface Variables {
  learningPathId: string;
  payload: CreateProgressionRulePayload;
}

export function useCreateProgressionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ learningPathId, payload }: Variables) =>
      progressionRulesApi.create(learningPathId, payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: progressionRuleKeys.listByLearningPath(variables.learningPathId),
      });
    },
  });
}
