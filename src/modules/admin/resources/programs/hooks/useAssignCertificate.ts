import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '@/shared/api/learning-paths.api';
import { learningPathKeys } from '@/shared/queries/keys';

interface AssignCertificateVariables {
  learningPathId: string;
  certificateId: string;
}

export function useAssignCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ learningPathId, certificateId }: AssignCertificateVariables) =>
      learningPathsApi.assignCertificate(learningPathId, certificateId).then((r) => r.data),
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
