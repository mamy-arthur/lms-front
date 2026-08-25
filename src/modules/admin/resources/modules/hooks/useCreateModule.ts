import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import type { CreateModulePayload } from '../types';
import { getApiErrorMessage } from '@/shared/lib/errors';

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModulePayload) => adminModulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competencyKeys.lists() });
      toast.success('Module créé.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la création.'));
    },
  });
}
