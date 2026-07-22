import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';

export function useLinkCompetencyToLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, competencyId }: { id: string; competencyId: string }) =>
      learningPathsApi.linkCompetency(id, competencyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningPathKeys.detail(variables.id) });
    },
  });
}
