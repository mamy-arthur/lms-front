// ─────────────────────────────────────────────────────────────────────────────
// Moteur d'exécution — API.md §15.13, docs/progression-execution.md
//
// Le backend fige une définition d'exécution à l'inscription. Chaque passage sur
// un module ou une évaluation est une « visite » (node execution) identifiée par
// un UUID que SEUL le serveur produit. Le frontend suit `current_execution`,
// `actionable` et `next_action` : il ne recalcule jamais la branche suivante, et
// les changements de catalogue post-inscription ne modifient pas ce snapshot.
// ─────────────────────────────────────────────────────────────────────────────

export type EnrollmentExecutionStatus =
  'not_started' | 'in_progress' | 'completed' | 'failed' | 'expired';

/** `completed`, `failed` et `expired` sont terminaux : plus aucune mutation pédagogique. */
export const TERMINAL_ENROLLMENT_STATUSES: readonly EnrollmentExecutionStatus[] = [
  'completed',
  'failed',
  'expired',
];

export type ExecutionNodeType = 'module' | 'evaluation' | 'certificate';

export type ExecutionVisitStatus = 'available' | 'in_progress' | 'completed' | 'cancelled';

export type ExecutionNextAction = 'start_evaluation' | 'complete_content';

export type ValidationRoundStatus = 'open' | 'satisfied' | 'exhausted';

/** Une visite. Revenir sur un même nœud produit une NOUVELLE visite, jamais une reprise de l'ancienne. */
export interface ApiExecutionVisit {
  id: string;
  node_type: ExecutionNodeType;
  node_id: string;
  visit_number: number;
  status: ExecutionVisitStatus;
  validation_round_id: string | null;
  score: number | null;
  result: string | null;
  available_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Budget de tentatives d'une évaluation. `max_attempts`/`remaining_attempts` à
 * `null` signifient « illimité » — et non « zéro ». `attempts_used` est toujours
 * numérique.
 */
export interface ApiValidationRound {
  id: string;
  round_number: number;
  status: ValidationRoundStatus;
  max_attempts: number | null;
  attempts_used: number;
  failed_attempts: number;
  remaining_attempts: number | null;
  opened_at: string;
  closed_at: string | null;
}

export interface ApiExecutionCounts {
  total: number;
  completed: number;
  /** Présent sur `coverage` uniquement. */
  percentage?: number;
}

/** Condition figée de la règle portée par le nœud. Son `null` est significatif. */
export interface ApiExecutionCondition {
  type: 'module_completed' | 'evaluation_passed' | 'evaluation_completed';
  rule_type?: 'all' | 'any';
  min_score_percentage?: number;
}

/**
 * Projection d'un nœud figé.
 *
 * `readable` (exposé aussi sous `accessible` dans le graphe HTTP) = consultable.
 * `actionable` = mutation autorisée maintenant. Les deux sont indépendants :
 * un historique reste lisible alors que toute écriture est verrouillée.
 */
export interface ApiExecutionNode {
  type: ExecutionNodeType;
  id: string;
  title?: string | null;
  evaluation_type?: 'PARTIAL' | 'FINAL';
  max_attempts: number | null;
  condition?: ApiExecutionCondition | null;
  current: boolean;
  actionable: boolean;
  readable: boolean;
  /** Une nouvelle visite est obligatoire, même si le nœud a déjà été terminé. */
  required_to_repeat: boolean;
  /** Preuve historique : ne dispense pas de rejouer le nœud. */
  historical_completed: boolean;
  /** Null tant que la visite courante n'a pas produit de résultat : jamais l'ancienne note. */
  current_score: number | null;
  current_result: string | null;
  current_execution: ApiExecutionVisit | null;
  round: ApiValidationRound | null;
  rounds: ApiValidationRound[];
  history: ApiExecutionVisit[];
  /** Chemin actif. */
  progress: ApiExecutionCounts;
  /** Historique cumulé, projection distincte de `progress`. */
  coverage: ApiExecutionCounts;
  next_action: ExecutionNextAction | null;
}

/**
 * Snapshot retourné par `POST .../node-executions/{id}/start` et embarqué sous
 * `execution` dans le résumé. `nodes` est ici une MAP indexée `type:id`,
 * contrairement au graphe HTTP qui expose un tableau ordonné.
 */
export interface ApiExecutionSnapshot {
  definition_id: string;
  state_revision: number;
  status: EnrollmentExecutionStatus;
  current_execution: ApiExecutionVisit | null;
  nodes: Record<string, ApiExecutionNode>;
  pending_validation_rounds: Record<string, string>;
  progress: ApiExecutionCounts;
  coverage: ApiExecutionCounts;
  completed_counts: { historical: number; active_route: number };
  unlimited_attempts: boolean;
}

// ── Contexte de mutation ─────────────────────────────────────────────────────

/**
 * À joindre à TOUTE mutation apprenant : complétion de contenu, démarrage de
 * nœud ou de tentative, enregistrement du temps, commit SCORM.
 *
 * Les deux champs sont obligatoires côté serveur : les omettre produit un 422,
 * et transmettre une visite ou une révision périmée un 409.
 */
export interface ExecutionMutationContext {
  node_execution_id: string;
  expected_state_revision: number;
}
