import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { learningPathsApi } from '../api';
import { learningPathKeys, shopLearningPathKeys } from '@/shared/queries/keys';
import type { CreateLearningPathPayload } from '../types';
import { getApiErrorMessage } from '@/shared/lib/errors';

export function useCreateLearningPath() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLearningPathPayload) => learningPathsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningPathKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shopLearningPathKeys.all });
      toast.success('Parcours créé.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la création.'));
    },
  });
}
