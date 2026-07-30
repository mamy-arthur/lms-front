import { makeToggleActiveMutation } from '@modules/shared/hooks/resourceMutations';
import { clientUsersApi } from '../api';
import { TENANT_USERS_QUERY_KEY } from './useClientUsersQuery';

export const useToggleClientUserActive = makeToggleActiveMutation(
  clientUsersApi,
  TENANT_USERS_QUERY_KEY,
  {
    success: 'Statut mis à jour',
    error: 'Échec de la mise à jour du statut',
  },
);
