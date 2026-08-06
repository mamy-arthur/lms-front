import { makeToggleActiveMutation } from '@modules/shared/hooks/resourceMutations';
import { adminUsersApi } from '../api';
import { ADMIN_USERS_QUERY_KEY } from './useUsersQuery';

export const useToggleUserActive = makeToggleActiveMutation(adminUsersApi, ADMIN_USERS_QUERY_KEY, {
  success: 'Statut mis à jour',
  error: 'Échec de la mise à jour du statut',
});
