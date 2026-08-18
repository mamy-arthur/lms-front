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
}

export interface ApiEvaluationAttempt {
  id: string;
  evaluation_id: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  started_at: string;
  completed_at: string | null;
  quizzes: ApiAttemptQuiz[];
}
