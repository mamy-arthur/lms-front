import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import type { CreateModulePayload, Module } from '../types';
import { normalizeModule } from '../types';
import { ADMIN_MODULES_QUERY_KEY } from './useModulesQuery';

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModulePayload) => adminModulesApi.create(data),
    onSuccess: ({ data: rawModule }) => {
      const newModule = normalizeModule(rawModule as unknown as Record<string, unknown>);
      queryClient.setQueryData<{ data: Module[]; total: number }>(
        ADMIN_MODULES_QUERY_KEY,
        (prev) => ({
          data: [newModule, ...(prev?.data ?? [])],
          total: (prev?.total ?? 0) + 1,
        }),
      );
    },
  });
}
