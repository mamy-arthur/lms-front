export interface ApiAttemptQuizOption {
  id: string;
  label: string;
}

export interface ApiAttemptQuiz {
  /** attemptQuizId — used both as local question id and in POST /answer calls */
  id: string;
  quiz_id: string;
  position: number;
  points: number;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'matching';
  question: string;
  options?: ApiAttemptQuizOption[];
  /** Matching: items shown on the left side */
  left_values?: string[];
  /** Matching: answer pool shown on the right side (same length as left_values) */
  right_values?: string[];
  submitted_answer: unknown;
  /** Optional only for legacy fixtures. Production responses include this counter. */
  answer_revision?: number;
}

export type EvaluationCompletionReason = 'manual' | 'timeout' | 'page_reload';

export interface ApiEvaluationAttempt {
  id: string;
  evaluation_id: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  started_at: string;
  completed_at: string | null;
  time_limit_minutes?: number | null;
  expires_at?: string | null;
  server_now?: string;
  completion_reason?: EvaluationCompletionReason | null;
  page_session_id?: string | null;
  enrollment_id?: string | null;
  node_execution_id?: string | null;
  validation_round_id?: string | null;
  quizzes: ApiAttemptQuiz[];
}
