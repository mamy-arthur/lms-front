import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressionRulesApi } from '@/shared/api/progression-rules.api';
import { progressionRuleKeys } from '@/shared/queries/keys';

interface Variables {
  ruleId: string;
  learningPathId: string;
}

export function useDeactivateProgressionRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId }: Variables) =>
      progressionRulesApi.deactivate(ruleId).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: progressionRuleKeys.listByLearningPath(variables.learningPathId),
      });
    },
  });
}
