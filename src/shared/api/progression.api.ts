import { apiPost } from '@/shared/lib/apiClient';
import type { ApiExecutionSnapshot } from '@/shared/types/progression.types';

/**
 * Progression apprenant — API.md §15.13.
 *
 * La lecture passe par `GET /enrollments/{id}/summary`, qui embarque le même
 * snapshot que `GET /progression` sous `execution`, plus les libellés du
 * parcours. Lire les deux ferait cohabiter deux `state_revision` potentiellement
 * décalées, donc des 409 fantomes sur la concurrence optimiste.
 */
export const progressionApi = {
  /**
   * Démarre ou reprend la visite `executionId`. L'identifiant vient toujours du
   * serveur (`current_execution.id`) : le client ne fabrique jamais de visite.
   * `expected_state_revision` porte la concurrence optimiste et est obligatoire.
   */
  startNodeExecution: (enrollmentId: string, executionId: string, expectedStateRevision: number) =>
    apiPost<{ data: ApiExecutionSnapshot }>(
      `enrollments/${enrollmentId}/node-executions/${executionId}/start`,
      { expected_state_revision: expectedStateRevision },
    ),
};
