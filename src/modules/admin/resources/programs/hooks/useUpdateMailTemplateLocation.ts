import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';

export type UpdateMailTemplateLocationVars = {
  learningPathId: string;
  locationX: number | null;
  locationY: number | null;
};

export function useUpdateMailTemplateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ learningPathId, locationX, locationY }: UpdateMailTemplateLocationVars) =>
      learningPathsApi.updateMailTemplateLocation(learningPathId, {
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
