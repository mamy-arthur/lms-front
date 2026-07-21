import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import { ADMIN_MODULES_QUERY_KEY } from './useModules';
import { moduleQueryKey } from './useModule';

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; idnumber: string }) =>
      adminModulesApi.remove(id),
    onSuccess: (_data, { idnumber }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULES_QUERY_KEY });
      queryClient.removeQueries({ queryKey: moduleQueryKey(idnumber) });
    },
  });
}
