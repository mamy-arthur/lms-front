import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '../api';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminUsersApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Échec de la mise à jour du statut'),
  });
}
