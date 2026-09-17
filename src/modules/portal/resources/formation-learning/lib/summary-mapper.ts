import type {
  ApiPortalEvalSummary,
  ApiPortalLearningPathSummary,
  ApiPortalSummaryEntry,
  ApiPortalSummaryModule,
} from '@/shared/types/portal.types';
import { TERMINAL_ENROLLMENT_STATUSES } from '@/shared/types/progression.types';
import type {
  Formation,
  FormationExecution,
  FormationModule,
  FormationEvaluation,
  CourseSummary,
  CourseSection,
  CourseContent,
  NodeExecutionState,
  ProgressStatus,
} from './types';

/** Seuil retenu quand aucune règle figée ne fixe de score minimal. */
const DEFAULT_PASSING_SCORE = 70;

/**
 * Projette la définition d'exécution gelée à l'inscription sur le modèle
 * consommé par FormationPlayer.
 *
 * Mapping:
 *  ApiPortalSummaryModule  → FormationModule  (node)
 *  ApiPortalSummaryCourse  → CourseSummary    (accordion item inside module)
 *  ApiPortalSummarySection → CourseSection    (section inside course)
 *  ApiPortalSummaryEntry   → CourseContent    (content stub — data loaded lazily)
 *  module.evaluation       → FormationEvaluation (intermediate, inserted after its module)
 *  final_evaluations       → FormationEvaluation (finals, appended at the end)
 *
 * NOTE: CourseContent.courseId stores the course id (not the section id) because
 * the portal entry endpoint is scoped to /courses/{courseId}/entries/{entryId}.
 *
 * L'ordre, l'appartenance et les autorisations viennent exclusivement du
 * snapshot : un contenu dépublié, un module ou un certificat ajoutés après
 * l'inscription ne changent pas ce que l'apprenant voit.
 */
export function mapSummaryToFormation(summary: ApiPortalLearningPathSummary): Formation {
  const snapshot = summary.execution;
  const execution: FormationExecution = {
    definitionId: snapshot.definition_id,
    stateRevision: snapshot.state_revision,
    status: snapshot.status,
    currentExecution: snapshot.current_execution,
    terminal: TERMINAL_ENROLLMENT_STATUSES.includes(snapshot.status),
    coveragePercent: Math.round(summary.coverage.percent),
    completedCounts: {
      historical: snapshot.completed_counts.historical,
      activeRoute: snapshot.completed_counts.active_route,
    },
    unlimitedAttempts: snapshot.unlimited_attempts,
    snapshot,
  };

  const nodes: (FormationModule | FormationEvaluation)[] = [];
  let order = 1;
  // Curseur de séquence : il se ferme sur le premier contenu restant à faire.
  const sequence = { pending: false };

  for (const mod of summary.modules) {
    const state = toNodeExecutionState(mod);
    const courses: CourseSummary[] = mod.courses.map((course) => ({
      id: course.id,
      title: course.name ?? '',
      sections: course.sections.map((section, sectionIndex): CourseSection => ({
        // La définition fige l'ordre des contenus, pas l'identité des sections :
        // `id` arrive à null et un identifiant local suffit au rendu.
        id: section.id ?? `${course.id}:frozen:${sectionIndex}`,
        moduleId: mod.id,
        title: section.name ?? '',
        contents: section.content_entries.map((entry): CourseContent => ({
          id: `${mod.id}:${course.id}:${entry.id}`,
          competencyId: mod.id,
          entryId: entry.id,
          courseId: course.id,
          type: 'page',
          title: entry.title ?? '',
          status: entryStatus(entry, state, sequence),
          completed: entry.completed,
          historicalCompleted: entry.historical_completed,
        })),
      })),
    }));

    nodes.push({
      id: mod.id,
      formationId: summary.id,
      type: 'module',
      title: mod.name,
      status: executionNodeStatus(state),
      progress: Math.round(mod.progress.percent),
      order: order++,
      courses,
      execution: state,
    } satisfies FormationModule);

    if (mod.evaluation) {
      nodes.push(mapExecutionEvaluation(summary.id, mod.evaluation, 'intermediate', order++));
    }
  }

  // `final_evaluations` porte TOUTES les finales figées ; `final_evaluation`
  // n'en est que l'alias du premier élément.
  for (const final of summary.final_evaluations) {
    nodes.push(mapExecutionEvaluation(summary.id, final, 'final', order++));
  }

  return {
    id: summary.id,
    slug: summary.id,
    title: summary.name,
    progress: Math.round(summary.progress.percent),
    nodes,
    execution,
  };
}

function mapExecutionEvaluation(
  formationId: string,
  evaluation: ApiPortalEvalSummary,
  evaluationType: 'intermediate' | 'final',
  order: number,
): FormationEvaluation {
  const state = toNodeExecutionState(evaluation);

  return {
    id: evaluation.id,
    formationId,
    type: 'evaluation',
    evaluationType,
    title: evaluation.title,
    status: executionNodeStatus(state),
    order,
    // Seuil figé par la règle snapshotée, et non une constante du frontend.
    passingScore: evaluation.condition?.min_score_percentage ?? DEFAULT_PASSING_SCORE,
    maxAttempts: evaluation.max_attempts ?? undefined,
    execution: state,
  };
}

function toNodeExecutionState(
  node: ApiPortalSummaryModule | ApiPortalEvalSummary,
): NodeExecutionState {
  const latestVisit = node.history.reduce<typeof node.current_execution>(
    (latest, visit) => (!latest || visit.visit_number > latest.visit_number ? visit : latest),
    null,
  );
  return {
    currentExecutionId: node.current_execution?.id ?? null,
    currentVisit: node.current_execution,
    readExecutionId: node.readable ? ((node.current_execution ?? latestVisit)?.id ?? null) : null,
    current: node.current,
    actionable: node.actionable,
    readable: node.readable,
    requiredToRepeat: node.required_to_repeat,
    historicalCompleted: node.historical_completed,
    currentScore: node.current_score,
    currentResult: node.current_result,
    round: node.round,
    nextAction: node.next_action,
    progressPercent: Math.round(node.progress.percent),
    coveragePercent: Math.round(node.coverage.percent),
  };
}

/**
 * Un repassage s'ouvre comme un premier passage : terminé donc consultable, en
 * cours donc ouvert, suivant donc verrouillé. Rien ne distingue les deux — le
 * temps de consultation est mesuré dans les deux cas. Seule la couleur change,
 * `retry` signalant une preuve historique sans preuve courante.
 */
function entryStatus(
  entry: ApiPortalSummaryEntry,
  node: NodeExecutionState,
  sequence: { pending: boolean },
): ProgressStatus {
  if (entry.completed) return 'completed';
  // Hors de la visite en cours, rien ne s'ouvre : un nœud franchi sans être
  // terminé ne doit pas davantage se rouvrir qu'un nœud encore à venir.
  if (!node.readable || !node.actionable) return 'locked';
  if (sequence.pending) return 'locked';
  sequence.pending = true;

  return entry.historical_completed ? 'retry' : 'available';
}

/**
 * Un nœud non `readable` n'a aucune visite : il reste verrouillé. Un nœud
 * `readable` mais non `actionable` reste consultable en lecture seule — la
 * désactivation des actions se joue sur `actionable`, jamais sur ce statut.
 */
function executionNodeStatus(state: NodeExecutionState): ProgressStatus {
  if (!state.readable) return 'locked';
  if (state.actionable) {
    // Une preuve historique ne satisfait pas une obligation de rejouer.
    if (state.requiredToRepeat) return 'retry';

    return state.currentVisit?.status === 'in_progress' ? 'in_progress' : 'available';
  }
  // Hors de la visite en cours, seul un nœud déjà acquis reste consultable : un
  // nœud à venir — fût-il déjà parcouru avant — attend son tour.
  return state.historicalCompleted && !state.requiredToRepeat ? 'completed' : 'locked';
}
