import type { QueryClient } from '@tanstack/react-query';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import {
  TERMINAL_ENROLLMENT_STATUSES,
  type ApiExecutionSnapshot,
} from '@/shared/types/progression.types';
import type { Formation } from './types';

/**
 * Adopte la révision rapportée par une écriture, sans attendre le rechargement.
 *
 * Le serveur est seul à connaître la révision courante, et il l'avance à chaque
 * transition. Tant que le client garde celle d'avant, toute écriture concurrente
 * — un commit SCORM part tout seul, sans geste de l'apprenant — est refusée en
 * 409. Le rechargement reste nécessaire : lui seul reconstruit les libellés et
 * les projections par nœud.
 */
export function adoptExecutionSnapshot(
  queryClient: QueryClient,
  enrollmentId: string,
  snapshot: ApiExecutionSnapshot,
): void {
  queryClient.setQueryData<Formation>(portalLearningPathKeys.summary(enrollmentId), (previous) =>
    previous === undefined
      ? previous
      : {
          ...previous,
          execution: {
            ...previous.execution,
            stateRevision: snapshot.state_revision,
            status: snapshot.status,
            terminal: TERMINAL_ENROLLMENT_STATUSES.includes(snapshot.status),
            currentExecution: snapshot.current_execution,
            snapshot,
          },
        },
  );
}
