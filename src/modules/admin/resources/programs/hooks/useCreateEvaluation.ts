import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import type { CreateEvaluationPayload } from '@/shared/api/evaluations.api';
import { learningPathKeys } from '@/shared/queries/keys';

interface CreateEvaluationVariables extends CreateEvaluationPayload {
  learningPathId: string;
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ learningPathId, ...data }: CreateEvaluationVariables) =>
      evaluationsApi.create(learningPathId, data).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: learningPathKeys.detail(variables.learningPathId),
      });
    },
  });
}
