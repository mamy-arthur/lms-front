import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '../api';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      toast.success('Utilisateur supprimé');
    },
    onError: () => toast.error("Échec de la suppression de l'utilisateur"),
  });
}
