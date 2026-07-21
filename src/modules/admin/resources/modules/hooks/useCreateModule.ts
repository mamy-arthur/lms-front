import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import type { CreateModulePayload } from '../types';
import { ADMIN_MODULES_QUERY_KEY } from './useModules';

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModulePayload) => adminModulesApi.create(data),
    onSuccess: () => {
      // Invalidate so the list re-fetches with the new item included.
      // Using invalidateQueries is safer than setQueriesData because it does
      // not depend on the response shape and cannot cause false mutation errors.
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULES_QUERY_KEY });
    },
  });
}
