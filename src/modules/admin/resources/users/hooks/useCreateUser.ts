import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminUsersApi } from '../api';
import type { CreateUserPayload } from '../types';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserPayload) => adminUsersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      toast.success('Utilisateur créé');
    },
    onError: () => toast.error("Échec de la création de l'utilisateur"),
  });
}
