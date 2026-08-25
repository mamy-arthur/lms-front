import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { moduleQueryKey } from './useModule';

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; idnumber: string }) => adminModulesApi.remove(id),
    onSuccess: (_data, { idnumber }) => {
      queryClient.invalidateQueries({ queryKey: competencyKeys.lists() });
      queryClient.removeQueries({ queryKey: moduleQueryKey(idnumber) });
      toast.success('Module supprimé.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la suppression.'));
    },
  });
}
