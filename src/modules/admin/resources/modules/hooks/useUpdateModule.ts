import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import type { UpdateModulePayload } from '../types';
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
    },
  });
}
