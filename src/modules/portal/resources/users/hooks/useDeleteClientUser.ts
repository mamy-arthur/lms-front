import { makeDeleteMutation } from '@modules/shared/hooks/resourceMutations';
import { clientUsersApi } from '../api';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export const useDeleteClientUser = makeDeleteMutation(clientUsersApi, TENANT_USERS_QUERY_KEY, {
  success: 'Utilisateur supprimé',
  error: "Échec de la suppression de l'utilisateur",
});
