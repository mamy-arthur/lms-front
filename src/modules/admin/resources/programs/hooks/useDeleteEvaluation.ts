import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import { evaluationKeys, learningPathKeys } from '@/shared/queries/keys';

interface DeleteEvaluationVariables {
  evaluationId: string;
  learningPathId: string;
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ evaluationId }: DeleteEvaluationVariables) =>
      evaluationsApi.delete(evaluationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: learningPathKeys.detail(variables.learningPathId),
      });
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.listByLearningPath(variables.learningPathId),
      });
    },
  });
}
