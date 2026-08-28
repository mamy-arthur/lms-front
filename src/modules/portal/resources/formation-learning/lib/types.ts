// ─────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────

export type ContentType = 'folder' | 'file' | 'page' | 'scorm' | 'survey' | 'url' | 'text-media';

export type ProgressStatus = 'completed' | 'in_progress' | 'available' | 'locked';

export interface CourseContent {
  id: string;
  /** courseId — used to call the portal entry endpoint (/courses/{courseId}/entries/{entryId}). */
  courseId: string;
  type: ContentType;
  title: string;
  status: ProgressStatus;
  completed?: boolean;
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
}

// ─────────────────────────────────────────────────────────
// Evaluation (quiz intermédiaire ou final)
// ─────────────────────────────────────────────────────────

export type EvaluationType = 'intermediate' | 'final';

export interface EvaluationAttempt {
  id: string;
  startedAt: string;
  completedAt?: string;
  score: number;
  passed: boolean;
  answers: Record<string, string[]>;
}

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
  durationMin?: number;
  questions: Record<string, unknown>[];
  attempt?: EvaluationAttempt | null;
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
}
