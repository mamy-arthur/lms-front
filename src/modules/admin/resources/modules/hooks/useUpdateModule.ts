import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import type { UpdateModulePayload } from '../types';
import { ADMIN_MODULES_QUERY_KEY } from './useModules';
import { moduleQueryKey } from './useModule';

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateModulePayload }) =>
      adminModulesApi.update(id, data),
    onSuccess: ({ data: raw }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULES_QUERY_KEY });
      if (raw.idnumber) {
        queryClient.invalidateQueries({ queryKey: moduleQueryKey(raw.idnumber) });
      }
    },
  });
}
