import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '@/shared/api/learning-paths.api';
import { learningPathKeys } from '@/shared/queries/keys';

interface AssignMailTemplateVariables {
  learningPathId: string;
  mailTemplateId: string;
  locationX?: number | null;
  locationY?: number | null;
}

export function useAssignMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      learningPathId,
      mailTemplateId,
      locationX,
      locationY,
    }: AssignMailTemplateVariables) =>
      learningPathsApi
        .assignMailTemplate(learningPathId, mailTemplateId, {
          location_x: locationX != null ? Math.round(locationX) : null,
          location_y: locationY != null ? Math.round(locationY) : null,
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
