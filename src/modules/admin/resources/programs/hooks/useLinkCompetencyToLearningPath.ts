import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';

export type LinkCompetencyVars = {
  id: string;
  competencyId: string;
  locationX?: number | null;
  locationY?: number | null;
};

export function useLinkCompetencyToLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, competencyId, locationX, locationY }: LinkCompetencyVars) =>
      learningPathsApi.linkCompetency(id, {
        competency_id: competencyId,
        location_x: locationX != null ? Math.round(locationX) : null,
        location_y: locationY != null ? Math.round(locationY) : null,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningPathKeys.detail(variables.id) });
    },
  });
}
