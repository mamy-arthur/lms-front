import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isExecutionContextRejection } from '@/shared/lib/execution-conflict';
import { portalLearningPathKeys, portalMyEnrollmentsKeys } from '@/shared/queries/keys';

/**
 * Recharge l'état serveur après un refus de contexte d'exécution, et signale
 * à l'appelant qu'il doit prévenir l'apprenant plutôt que de proposer un rejeu.
 *
 * `409 execution_conflict` : le contexte local est périmé. La mutation est
 * abandonnée et l'état serveur rechargé, ce qui remplace `node_execution_id` et
 * `state_revision`. On ne rejoue jamais la requête en substituant la visite
 * courante à celle qui a été refusée : l'ancienne action appartient à un passage
 * qui n'est plus le bon.
 *
 * `422` portant sur la visite ou la révision : un champ d'exécution obligatoire
 * manque ou est invalide, recharger est la seule issue. Tout autre `422` est une
 * erreur métier et reste à la charge de l'appelant, qui doit en afficher le
 * message réel.
 */
export function useExecutionConflictRecovery(enrollmentId: string) {
  const queryClient = useQueryClient();

  return useCallback(
    (err: unknown): boolean => {
      if (!isExecutionContextRejection(err)) return false;

      void queryClient.invalidateQueries({
        queryKey: portalLearningPathKeys.summary(enrollmentId),
      });
      void queryClient.invalidateQueries({ queryKey: portalMyEnrollmentsKeys.all });

      return true;
    },
    [enrollmentId, queryClient],
  );
}
