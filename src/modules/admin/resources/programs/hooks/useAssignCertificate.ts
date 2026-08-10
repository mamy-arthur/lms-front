import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '@/shared/api/learning-paths.api';
import { learningPathKeys } from '@/shared/queries/keys';

interface AssignCertificateVariables {
  learningPathId: string;
  certificateId: string;
  locationX?: number | null;
  locationY?: number | null;
}

export function useAssignCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      learningPathId,
      certificateId,
      locationX,
      locationY,
    }: AssignCertificateVariables) =>
      learningPathsApi
        .assignCertificate(learningPathId, certificateId, {
          location_x: locationX ?? null,
          location_y: locationY ?? null,
        })
        .then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: learningPathKeys.detail(variables.learningPathId),
      });
      queryClient.invalidateQueries({
        queryKey: learningPathKeys.lists(),
      });
    },
  });
}
