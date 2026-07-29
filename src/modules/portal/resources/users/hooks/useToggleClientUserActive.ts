import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClientUsersApi } from '../api';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useToggleClientUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      ClientUsersApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Échec de la mise à jour du statut'),
  });
}
