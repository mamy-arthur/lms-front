import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';

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
      queryClient.invalidateQueries({ queryKey: competencyKeys.lists() });
    },
  });
}
