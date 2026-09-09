import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/shared/lib/errors';
import { adminUsersApi } from '../api';

/**
 * Aucune invalidation de cache : l'action ne modifie pas les données affichées
 * dans la liste, seulement l'état 2FA interne de l'utilisateur.
 */
export function useResetUserTwoFactor() {
  return useMutation({
    mutationFn: (id: string) => adminUsersApi.resetTwoFactor(id),
    onSuccess: (response) =>
      toast.success(response.message ?? 'Double authentification réinitialisée'),
    onError: (error) =>
      toast.error(
        getApiErrorMessage(error, 'Échec de la réinitialisation de la double authentification'),
      ),
  });
}
