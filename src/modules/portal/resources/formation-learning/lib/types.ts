import type {
  ApiExecutionSnapshot,
  ApiExecutionVisit,
  ApiValidationRound,
  EnrollmentExecutionStatus,
  ExecutionNextAction,
} from '@/shared/types/progression.types';

// ─────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────

export type ContentType = 'folder' | 'file' | 'page' | 'scorm' | 'survey' | 'url' | 'text-media';

/** `retry` : déjà parcouru, mais le moteur impose une nouvelle visite. */
export type ProgressStatus = 'completed' | 'in_progress' | 'available' | 'locked' | 'retry';

export interface CourseContent {
  /** Navigation identity, scoped to the module and course for API contents. */
  id: string;
  /** Module competency ID required by enrollment-scoped APIs. */
  competencyId?: string;
  /** Raw backend UUID for API calls; absent for mock contents. */
  entryId?: string;
  /** courseId — used to call the portal entry endpoint (/courses/{courseId}/entries/{entryId}). */
  courseId: string;
  type: ContentType;
  title: string;
  status: ProgressStatus;
  /** Terminé DANS la visite courante — seule preuve qui satisfait le chemin actif. */
  completed: boolean;
  /** Terminé lors d'un passage antérieur. N'exempte pas d'une visite obligatoire. */
  historicalCompleted: boolean;
  readOnly?: boolean;
  durationMin?: number;
  data?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────
// Module
// ─────────────────────────────────────────────────────────

export interface CourseSection {
  id: string;
  moduleId: string;
  title: string;
  contents: CourseContent[];
}

export interface CourseSummary {
  id: string;
  title: string;
  sections: CourseSection[];
}

export interface FormationModule {
  id: string;
  formationId: string;
  type: 'module';
  title: string;
  status: ProgressStatus;
  progress: number;
  order: number;
  courses: CourseSummary[];
  execution: NodeExecutionState;
}

// ─────────────────────────────────────────────────────────
// Evaluation (quiz intermédiaire ou final)
// ─────────────────────────────────────────────────────────

export type EvaluationType = 'intermediate' | 'final';

export interface FormationEvaluation {
  id: string;
  formationId: string;
  type: 'evaluation';
  evaluationType: EvaluationType;
  title: string;
  status: ProgressStatus;
  order: number;
  passingScore: number;
  maxAttempts?: number;
  /** Frozen limit, distinct from estimated duration. Null = unlimited. */
  timeLimitMinutes?: number | null;
  durationMin?: number;
  execution: NodeExecutionState;
}

// ─────────────────────────────────────────────────────────
// Attestation
// ─────────────────────────────────────────────────────────

export interface FormationAttestation {
  id: string;
  formationId: string;
  issuedAt?: string;
  downloadUrl?: string;
}

// ─────────────────────────────────────────────────────────
// Formation
// ─────────────────────────────────────────────────────────

export type FormationNode = FormationModule | FormationEvaluation;

// ─────────────────────────────────────────────────
// Exécution
// ─────────────────────────────────────────────────

/**
 * État d'exécution d'un nœud figé. `readable` et `actionable` sont indépendants :
 * un historique reste consultable alors que toute écriture est verrouillée.
 */
export interface NodeExecutionState {
  /** Visite en cours sur ce nœud. `null` tant qu'aucune n'a été ouverte. */
  currentExecutionId: string | null;
  currentVisit: ApiExecutionVisit | null;
  /** Active-route visit or latest historical visit, for read-only content access. */
  readExecutionId: string | null;
  /** Le nœud porte la visite courante de l'inscription. */
  current: boolean;
  /** Mutation autorisée maintenant — seule condition pour activer une action. */
  actionable: boolean;
  readable: boolean;
  /** Une nouvelle visite est obligatoire, même si le nœud a déjà été terminé. */
  requiredToRepeat: boolean;
  historicalCompleted: boolean;
  /** `null` tant que la visite courante n'a pas produit de résultat. */
  currentScore: number | null;
  currentResult: string | null;
  /** Budget de tentatives du round courant. `null` = aucun round ouvert. */
  round: ApiValidationRound | null;
  nextAction: ExecutionNextAction | null;
  /** Chemin actif. */
  progressPercent: number;
  /** Historique cumulé — projection distincte, jamais une preuve de réussite. */
  coveragePercent: number;
}

export interface FormationExecution {
  definitionId: string;
  /** Concurrence optimiste : à renvoyer sur chaque mutation. */
  stateRevision: number;
  status: EnrollmentExecutionStatus;
  /** Visite courante de l'inscription, toutes branches confondues. */
  currentExecution: ApiExecutionVisit | null;
  /** `completed`, `failed` ou `expired` : aucune mutation pédagogique possible. */
  terminal: boolean;
  coveragePercent: number;
  completedCounts: { historical: number; activeRoute: number };
  unlimitedAttempts: boolean;
  snapshot: ApiExecutionSnapshot;
}

export interface Formation {
  id: string;
  slug: string;
  title: string;
  description?: string;
  instructor?: string;
  progress: number;
  totalDurationMin?: number;
  nodes: FormationNode[];
  attestation?: FormationAttestation | null;
  execution: FormationExecution;
}
