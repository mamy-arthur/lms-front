import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import { moduleQueryKey } from './useModule';

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; idnumber: string }) => adminModulesApi.remove(id),
    onSuccess: (_data, { idnumber }) => {
      queryClient.invalidateQueries({ queryKey: competencyKeys.lists() });
      queryClient.removeQueries({ queryKey: moduleQueryKey(idnumber) });
    },
  });
}
