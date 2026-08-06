import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '@/shared/api/learning-paths.api';
import { learningPathKeys } from '@/shared/queries/keys';

interface AssignMailTemplateVariables {
  learningPathId: string;
  mailTemplateId: string;
}

export function useAssignMailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ learningPathId, mailTemplateId }: AssignMailTemplateVariables) =>
      learningPathsApi.assignMailTemplate(learningPathId, mailTemplateId).then((r) => r.data),
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
