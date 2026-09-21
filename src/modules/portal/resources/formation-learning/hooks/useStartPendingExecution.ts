import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { progressionApi } from '@/shared/api/progression.api';
import { getApiErrorMessage } from '@/shared/lib/errors';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import { pendingStartExecutionId } from '../lib/execution-context';
import { EXECUTION_CONFLICT_MESSAGE } from '../lib/constants';
import { adoptExecutionSnapshot } from '../lib/execution-cache';
import type { Formation } from '../lib/types';
import { useExecutionConflictRecovery } from './useExecutionConflictRecovery';

/**
 * Démarre la visite que le serveur a rendue `available`.
 *
 * Le frontend ne fabrique jamais d'identifiant de visite : il reprend
 * `current_execution.id` du snapshot et transmet la révision qu'il a lue. Le
 * serveur peut en profiter pour avancer automatiquement les modules vides, d'où
 * le rechargement du résumé : lui seul reconstruit les libellés du parcours. La
 * révision rapportée est en revanche adoptée sans attendre, sinon une écriture
 * lancée dans l'intervalle repartirait avec celle d'avant le démarrage.
 *
 * Un même couple visite/révision n'est tenté qu'une fois : sans ce garde-fou, un
 * double clic ou un re-rendu concurrent enverrait deux démarrages, dont le second
 * serait refusé en 409 et ferait clignoter l'interface.
 */
export function useStartPendingExecution(enrollmentId: string, formation: Formation | null) {
  const queryClient = useQueryClient();
  const recoverFromConflict = useExecutionConflictRecovery(enrollmentId);
  const attemptedRef = useRef<string | null>(null);

  const executionId = pendingStartExecutionId(formation);
  const stateRevision = formation?.execution.stateRevision;

  useEffect(() => {
    if (!executionId || stateRevision === undefined) return;

    const attemptKey = `${executionId}@${stateRevision}`;
    if (attemptedRef.current === attemptKey) return;
    attemptedRef.current = attemptKey;

    let cancelled = false;

    const start = () => {
      progressionApi
        .startNodeExecution(enrollmentId, executionId, stateRevision)
        .then((res) => {
          adoptExecutionSnapshot(queryClient, enrollmentId, res.data);

          // L'invalidation porte sur le cache, pas sur le composant : la sauter
          // parce que l'effet a été nettoyé laisserait le reste du résumé — dont
          // les projections par nœud — sur l'état d'avant le démarrage.
          return queryClient.invalidateQueries({
            queryKey: portalLearningPathKeys.summary(enrollmentId),
          });
        })
        .catch((err: unknown) => {
          if (recoverFromConflict(err)) {
            if (!cancelled) toast.error(EXECUTION_CONFLICT_MESSAGE);
            return;
          }
          // Panne transitoire : sans lever la garde, l'étape resterait bloquée
          // jusqu'à un rechargement complet, la révision ne bougeant plus.
          attemptedRef.current = null;
          if (cancelled) return;
          toast.error(getApiErrorMessage(err, 'Impossible de démarrer cette étape du parcours.'), {
            action: {
              label: 'Réessayer',
              onClick: () => {
                attemptedRef.current = attemptKey;
                start();
              },
            },
          });
        });
    };

    start();

    return () => {
      cancelled = true;
    };
  }, [enrollmentId, executionId, stateRevision, queryClient, recoverFromConflict]);
}
