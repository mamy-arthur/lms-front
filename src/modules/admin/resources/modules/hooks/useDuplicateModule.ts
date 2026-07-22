import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminModulesApi } from '../api';
import { ADMIN_MODULES_QUERY_KEY } from './useModules';

/**
 * Duplicates a module via POST /platform/competencies/{id}/duplicate.
 */
interface DuplicateModuleVars {
  id: string;
  shortname?: string;
}

export function useDuplicateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, shortname }: DuplicateModuleVars) =>
      adminModulesApi.duplicate(id, shortname),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULES_QUERY_KEY });
    },
  });
}
