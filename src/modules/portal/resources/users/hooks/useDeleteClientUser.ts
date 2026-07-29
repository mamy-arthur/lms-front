import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClientUsersApi } from '../api';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useDeleteClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ClientUsersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
      toast.success('Utilisateur supprimé');
    },
    onError: () => toast.error("Échec de la suppression de l'utilisateur"),
  });
}
