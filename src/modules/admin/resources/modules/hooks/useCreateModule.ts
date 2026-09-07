import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import type { CreateModulePayload } from '../types';

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateModulePayload) => adminModulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competencyKeys.lists() });
    },
  });
}
