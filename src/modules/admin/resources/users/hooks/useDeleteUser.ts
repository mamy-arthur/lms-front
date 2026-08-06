import { makeDeleteMutation } from '@modules/shared/hooks/resourceMutations';
import { adminUsersApi } from '../api';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export const useDeleteUser = makeDeleteMutation(adminUsersApi, ADMIN_USERS_QUERY_KEY, {
  success: 'Utilisateur supprimé',
  error: "Échec de la suppression de l'utilisateur",
});
