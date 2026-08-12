import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';

export type UpdateCompetencyLocationVars = {
  learningPathId: string;
  competencyId: string;
  locationX: number | null;
  locationY: number | null;
};

export function useUpdateCompetencyLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      learningPathId,
      competencyId,
      locationX,
      locationY,
    }: UpdateCompetencyLocationVars) =>
      learningPathsApi.updateCompetencyLocation(learningPathId, competencyId, {
        location_x: locationX != null ? Math.round(locationX) : null,
        location_y: locationY != null ? Math.round(locationY) : null,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: learningPathKeys.detail(variables.learningPathId),
      });
    },
  });
}
