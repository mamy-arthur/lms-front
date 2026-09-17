import type { ExecutionMutationContext } from '@/shared/types/progression.types';
import type { Formation, NodeExecutionState } from './types';

/** Projection d'exécution d'un nœud du parcours. */
export function findNodeExecutionState(
  formation: Formation | null | undefined,
  nodeId: string | null | undefined,
): NodeExecutionState | null {
  if (!formation || !nodeId) return null;

  return formation.nodes.find((node) => node.id === nodeId)?.execution ?? null;
}

/**
 * Contexte obligatoire de toute mutation portant sur `nodeId`.
 *
 * `null` quand le nœud n'a pas de visite ouverte : l'action doit alors être
 * bloquée côté UI plutôt qu'envoyée sans contexte, ce que le serveur refuserait
 * en 422. La visite vient du nœud concerné — jamais de la visite courante de
 * l'inscription, dont la substitution ferait retomber une preuve dans le
 * mauvais passage.
 */
export function buildExecutionContext(
  formation: Formation | null | undefined,
  nodeId: string | null | undefined,
): ExecutionMutationContext | null {
  const node = findNodeExecutionState(formation, nodeId);
  if (!formation || !node?.currentExecutionId) return null;

  return {
    node_execution_id: node.currentExecutionId,
    expected_state_revision: formation.execution.stateRevision,
  };
}

/**
 * Visite en attente de démarrage : le serveur l'a rendue `available` mais elle
 * n'est pas encore `in_progress`. C'est le seul cas où le frontend appelle
 * `POST .../node-executions/{id}/start`, avec l'identifiant fourni par le serveur.
 */
export function pendingStartExecutionId(formation: Formation | null | undefined): string | null {
  const execution = formation?.execution;
  if (!execution || execution.terminal) return null;

  const current = execution.currentExecution;

  return current !== null && current.status === 'available' ? current.id : null;
}
