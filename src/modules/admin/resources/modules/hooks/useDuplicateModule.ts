import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { competencyKeys } from '@/shared/queries/keys';
import { adminModulesApi } from '../api';
import { getApiErrorMessage } from '@/shared/lib/errors';

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
      toast.success('Module dupliqué.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la duplication.'));
    },
  });
}
