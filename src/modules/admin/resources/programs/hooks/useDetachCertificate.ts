import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '@/shared/api/learning-paths.api';
import { learningPathKeys } from '@/shared/queries/keys';

interface DetachCertificateVariables {
  learningPathId: string;
}

export function useDetachCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ learningPathId }: DetachCertificateVariables) =>
      learningPathsApi.detachCertificate(learningPathId),
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
