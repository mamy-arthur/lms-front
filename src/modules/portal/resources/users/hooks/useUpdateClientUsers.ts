import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientUsersApi } from '../api';
import type { UpdateClientUserPayload } from '../types';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useUpdateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientUserPayload }) =>
      clientUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
      toast.success('Utilisateur mis à jour');
    },
    onError: () => toast.error('Échec de la mise à jour de l’utilisateur'),
  });
}
