import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';
import { getApiErrorMessage } from '@/shared/lib/errors';

export function useDeleteLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => learningPathsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
      toast.success('Parcours supprimé.');
    },
    onError: (err: unknown) => {
      toast.error(
        getApiErrorMessage(
          err,
          "Impossible de supprimer ce parcours. Détachez d'abord toutes les compétences liées, puis réessayez.",
        ),
      );
    },
  });
}
