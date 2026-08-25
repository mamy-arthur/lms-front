import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import type { UpdateModulePayload } from '../types';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { moduleQueryKey } from './useModule';

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModulePayload }) =>
      adminModulesApi.update(id, data),
    onSuccess: ({ data: raw }) => {
      queryClient.invalidateQueries({ queryKey: competencyKeys.lists() });
      if (raw.idnumber) {
        queryClient.invalidateQueries({ queryKey: moduleQueryKey(raw.idnumber) });
      }
      toast.success('Module mis à jour.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour.'));
    },
  });
}
