import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import type { UpdateEvaluationPayload } from '@/shared/api/evaluations.api';
import { evaluationKeys, learningPathKeys } from '@/shared/queries/keys';

interface Variables {
  evaluationId: string;
  learningPathId: string;
  payload: UpdateEvaluationPayload;
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ evaluationId, payload }: Variables) =>
      evaluationsApi.update(evaluationId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.listByLearningPath(variables.learningPathId),
      });
      queryClient.invalidateQueries({
        queryKey: learningPathKeys.detail(variables.learningPathId),
      });
    },
  });
}
