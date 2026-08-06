import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { clientUsersApi } from '../api';
import type { CreateClientUserPayload } from '../types';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export function useCreateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientUserPayload) => clientUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_USERS_QUERY_KEY });
      toast.success('Utilisateur créé');
    },
    onError: () => toast.error('Échec de la création de l’utilisateur'),
  });
}
