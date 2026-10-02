import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ADMIN_CLIENTS_QUERY_KEY } from '@/modules/admin/resources/clients';
import { Role } from '@/shared/constants/roles';
import { getApiErrorStatus } from '@/shared/lib/errors';
import { adminUsersApi } from '../api';
import type { CreateUserPayload } from '../types';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserPayload) => adminUsersApi.create(data),
    onSuccess: (_response, payload) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      if (payload.role === Role.CLIENT_MANAGER) {
        queryClient.invalidateQueries({ queryKey: ADMIN_CLIENTS_QUERY_KEY });
      }
      toast.success('Utilisateur créé');
    },
    onError: (error) =>
      toast.error(
        getApiErrorStatus(error) === 403
          ? "Vous n'avez pas les droits pour créer cet utilisateur."
          : "Échec de la création de l'utilisateur",
      ),
  });
}
