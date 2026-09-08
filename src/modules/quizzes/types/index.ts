export type {
  Question,
  QuestionType,
  QuestionOption,
  MatchingPair,
  Duration,
} from '@/modules/shared/lib/question-types';

// ─── Trainee answer types ─────────────────────────────────────────────────────

/** Answer for true_false */
export type TrueFalseAnswer = boolean | null;

/** Answer for single_choice: option id */
export type SingleChoiceAnswer = string | null;

/** Answer for multiple_choice: set of option ids */
export type MultipleChoiceAnswer = Set<string>;

/** Answer for matching: map from left item id → right item id */
export type MatchingAnswer = Record<string, string>;

export type TraineeAnswer =
  TrueFalseAnswer | SingleChoiceAnswer | MultipleChoiceAnswer | MatchingAnswer;

export interface QuizState {
  /** Current question index (0-based) */
  currentIndex: number;
  /** Map of question id → trainee answer */
  answers: Record<string, TraineeAnswer>;
  /** Whether the quiz has been submitted */
  submitted: boolean;
}

// ─── Attempt ──────────────────────────────────────────────────────────────────

export type QuizAttemptStatus = 'in_progress' | 'completed' | 'abandoned';

/**
 * Represents a single attempt at a quiz.
 * When coming from the API, all fields are populated.
 * When computed locally (demo), completedAt / points are derived from answers.
 */
export interface QuizAttempt {
  /** ISO string or Date — when the trainee started the quiz */
  startedAt: Date;
  /** ISO string or Date — when the trainee submitted; null if still in progress */
  completedAt: Date | null;
  status: QuizAttemptStatus;
  /** Points earned by the trainee */
  pointsObtained: number;
  /** Maximum achievable points */
  maxPoints: number;
  /** Grade as a percentage (0–100) */
  grade: number;
}
