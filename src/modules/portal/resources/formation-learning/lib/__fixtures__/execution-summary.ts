import type {
  ApiPortalEvalSummary,
  ApiPortalLearningPathSummary,
  ApiPortalSummaryCourse,
  ApiPortalSummaryModule,
  ApiProgressCounts,
} from '@/shared/types/portal.types';
import type { ApiExecutionSnapshot, ApiExecutionVisit } from '@/shared/types/progression.types';

export const ENROLLMENT_ID = 'enrollment-1';

export function visit(overrides: Partial<ApiExecutionVisit> = {}): ApiExecutionVisit {
  return {
    id: 'exec-module-1',
    node_type: 'module',
    node_id: 'module-1',
    visit_number: 1,
    status: 'available',
    validation_round_id: null,
    score: null,
    result: null,
    available_at: '2026-09-15T08:00:00+00:00',
    started_at: null,
    completed_at: null,
    ...overrides,
  };
}

function counts(completed: number, total: number): ApiProgressCounts {
  return { percent: total > 0 ? Math.round((100 * completed) / total) : 0, completed, total };
}

export interface EntrySpec {
  id: string;
  title: string;
  completed?: boolean;
  historicalCompleted?: boolean;
}

export interface CourseSpec {
  id: string;
  name: string;
  entries: EntrySpec[];
}

export interface ModuleSpec {
  id: string;
  name: string;
  courses: CourseSpec[];
  /** Visite courante du module ; `null` pour un nœud jamais ouvert. */
  executionId?: string | null;
  visitStatus?: ApiExecutionVisit['status'];
  actionable?: boolean;
  readable?: boolean;
  requiredToRepeat?: boolean;
  historicalCompleted?: boolean;
}

export interface EvaluationSpec {
  id: string;
  title: string;
  actionable?: boolean;
  readable?: boolean;
  requiredToRepeat?: boolean;
  historicalCompleted?: boolean;
  currentScore?: number | null;
  minScorePercentage?: number;
  maxAttempts?: number | null;
  attemptsUsed?: number;
  remainingAttempts?: number | null;
  roundStatus?: 'open' | 'satisfied' | 'exhausted';
}

export interface SummarySpec {
  id?: string;
  name?: string;
  status?: ApiExecutionSnapshot['status'];
  stateRevision?: number;
  currentExecution?: ApiExecutionVisit | null;
  modules: ModuleSpec[];
  finalEvaluations?: EvaluationSpec[];
}

function buildCourse(module: ModuleSpec, course: CourseSpec): ApiPortalSummaryCourse {
  const completed = course.entries.filter((entry) => entry.completed).length;
  const historical = course.entries.filter(
    (entry) => entry.historicalCompleted ?? entry.completed,
  ).length;
  const progress = counts(completed, course.entries.length);
  const coverage = counts(historical, course.entries.length);

  return {
    id: course.id,
    name: course.name,
    accessible: module.readable ?? true,
    actionable: module.actionable ?? true,
    progress,
    coverage,
    // La définition fige l'ordre des contenus, pas l'identité des sections.
    sections: [
      {
        id: null,
        name: null,
        frozen: true,
        progress,
        coverage,
        content_entries: course.entries.map((entry) => ({
          id: entry.id,
          title: entry.title,
          completed: entry.completed ?? false,
          historical_completed: entry.historicalCompleted ?? entry.completed ?? false,
        })),
      },
    ],
  };
}

function buildModule(module: ModuleSpec): ApiPortalSummaryModule {
  const entries = module.courses.flatMap((course) => course.entries);
  const completed = entries.filter((entry) => entry.completed).length;
  const historical = entries.filter((entry) => entry.historicalCompleted ?? entry.completed).length;
  const executionId = module.executionId === undefined ? `exec-${module.id}` : module.executionId;
  const current =
    executionId === null
      ? null
      : visit({
          id: executionId,
          node_id: module.id,
          status: module.visitStatus ?? 'in_progress',
        });
  const actionable = module.actionable ?? true;

  return {
    id: module.id,
    name: module.name,
    type: 'module',
    accessible: module.readable ?? true,
    readable: module.readable ?? true,
    actionable,
    current: actionable,
    required_to_repeat: module.requiredToRepeat ?? false,
    historical_completed: module.historicalCompleted ?? false,
    current_score: null,
    current_result: null,
    current_execution: current,
    round: null,
    rounds: [],
    history: current ? [current] : [],
    next_action: actionable ? 'complete_content' : null,
    max_attempts: null,
    progress: counts(completed, entries.length),
    coverage: counts(historical, entries.length),
    evaluation: null,
    courses: module.courses.map((course) => buildCourse(module, course)),
  };
}

function buildEvaluation(evaluation: EvaluationSpec): ApiPortalEvalSummary {
  const actionable = evaluation.actionable ?? false;

  return {
    id: evaluation.id,
    title: evaluation.title,
    type: 'evaluation',
    evaluation_type: 'FINAL',
    accessible: evaluation.readable ?? true,
    readable: evaluation.readable ?? true,
    actionable,
    current: actionable,
    completed: false,
    score: evaluation.currentScore ?? null,
    required_to_repeat: evaluation.requiredToRepeat ?? false,
    historical_completed: evaluation.historicalCompleted ?? false,
    current_score: evaluation.currentScore ?? null,
    current_result: null,
    current_execution: actionable
      ? visit({ id: `exec-${evaluation.id}`, node_type: 'evaluation', node_id: evaluation.id })
      : null,
    max_attempts: evaluation.maxAttempts ?? 3,
    condition: {
      type: 'evaluation_passed',
      min_score_percentage: evaluation.minScorePercentage ?? 80,
    },
    round: {
      id: `round-${evaluation.id}`,
      round_number: 1,
      status: evaluation.roundStatus ?? 'open',
      max_attempts: evaluation.maxAttempts ?? 3,
      attempts_used: evaluation.attemptsUsed ?? 0,
      failed_attempts: evaluation.attemptsUsed ?? 0,
      remaining_attempts: evaluation.remainingAttempts ?? 3,
      opened_at: '2026-09-15T08:00:00+00:00',
      closed_at: null,
    },
    rounds: [],
    history: [],
    next_action: actionable ? 'start_evaluation' : null,
    progress: counts(0, 1),
    coverage: counts(0, 1),
  };
}

/** Résumé conforme au moteur : définition gelée + projections de visites. */
export function buildExecutionSummary(spec: SummarySpec): ApiPortalLearningPathSummary {
  const modules = spec.modules.map(buildModule);
  const finals = (spec.finalEvaluations ?? []).map(buildEvaluation);
  const totals = modules.reduce(
    (acc, module) => ({
      completed: acc.completed + module.progress.completed,
      total: acc.total + module.progress.total,
      historical: acc.historical + module.coverage.completed,
    }),
    { completed: 0, total: 0, historical: 0 },
  );

  const stateRevision = spec.stateRevision ?? 7;
  const status = spec.status ?? 'in_progress';
  const currentExecution =
    spec.currentExecution === undefined
      ? (modules.find((module) => module.actionable)?.current_execution ?? null)
      : spec.currentExecution;

  const snapshot: ApiExecutionSnapshot = {
    definition_id: 'definition-1',
    state_revision: stateRevision,
    status,
    current_execution: currentExecution,
    nodes: {},
    pending_validation_rounds: {},
    progress: { total: totals.total, completed: totals.completed },
    coverage: {
      total: totals.total,
      completed: totals.historical,
      percentage: totals.total > 0 ? (100 * totals.historical) / totals.total : 0,
    },
    completed_counts: { historical: totals.historical, active_route: totals.completed },
    unlimited_attempts: false,
  };

  return {
    id: spec.id ?? 'formation-1',
    name: spec.name ?? 'Formation',
    modules,
    progress: counts(totals.completed, totals.total),
    coverage: counts(totals.historical, totals.total),
    definition_id: snapshot.definition_id,
    state_revision: stateRevision,
    status,
    current_execution: currentExecution,
    completed_counts: snapshot.completed_counts,
    final_evaluation: finals[0] ?? null,
    final_evaluations: finals,
    execution: snapshot,
  };
}
