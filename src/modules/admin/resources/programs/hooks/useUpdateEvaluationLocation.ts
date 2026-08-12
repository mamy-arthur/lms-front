import { useMutation, useQueryClient } from '@tanstack/react-query';
import { evaluationsApi } from '@/shared/api/evaluations.api';
import { evaluationKeys } from '@/shared/queries/keys';

export type UpdateEvaluationLocationVars = {
  evaluationId: string;
  learningPathId: string;
  locationX: number;
  locationY: number;
};

export function useUpdateEvaluationLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ evaluationId, locationX, locationY }: UpdateEvaluationLocationVars) =>
      evaluationsApi.update(evaluationId, { location_x: Math.round(locationX), location_y: Math.round(locationY) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: evaluationKeys.listByLearningPath(variables.learningPathId),
      });
    },
  });
}
