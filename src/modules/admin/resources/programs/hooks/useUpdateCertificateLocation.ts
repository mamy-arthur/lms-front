import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';

export type UpdateCertificateLocationVars = {
  learningPathId: string;
  locationX: number | null;
  locationY: number | null;
};

export function useUpdateCertificateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ learningPathId, locationX, locationY }: UpdateCertificateLocationVars) =>
      learningPathsApi.updateCertificateLocation(learningPathId, {
        location_x: locationX,
        location_y: locationY,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: learningPathKeys.detail(variables.learningPathId),
      });
    },
  });
}
