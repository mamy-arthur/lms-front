import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { learningPathsApi } from '../api';
import { learningPathKeys, shopLearningPathKeys } from '@/shared/queries/keys';
import type { UpdateLearningPathPayload } from '../types';
import { getApiErrorMessage } from '@/shared/lib/errors';

export function useUpdateLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateLearningPathPayload) =>
      learningPathsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
      queryClient.invalidateQueries({ queryKey: learningPathKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: shopLearningPathKeys.all });
      toast.success('Parcours mis à jour.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour.'));
    },
  });
}
