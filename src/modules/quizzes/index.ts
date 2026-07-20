// ─── Components ───────────────────────────────────────────────────────────────
export { Quiz } from './components/Quiz';
export { QuestionRenderer } from './components/QuestionRenderer';
export { QuizProgress } from './components/QuizProgress';
export { QuizNavigation } from './components/QuizNavigation';
export { QuizSummary } from './components/QuizSummary';
export { SingleChoiceQuestion } from './components/question-types/SingleChoiceQuestion';
export { MultipleChoiceQuestion } from './components/question-types/MultipleChoiceQuestion';
export { TrueFalseQuestion } from './components/question-types/TrueFalseQuestion';
export { MatchingQuestion } from './components/question-types/MatchingQuestion';

// ─── Hooks ────────────────────────────────────────────────────────────────────
export { useQuizState } from './hooks/useQuizState';
// ─── Utils ──────────────────────────────────────────────────────────────────
export { isCorrect, computeScore } from './utils/quiz-scoring';
// ─── Pages ────────────────────────────────────────────────────────────────────
export { TraineeQuiz } from './pages/TraineeQuiz';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  Question,
  QuestionType,
  QuestionOption,
  MatchingPair,
  Duration,
  TraineeAnswer,
  TrueFalseAnswer,
  SingleChoiceAnswer,
  MultipleChoiceAnswer,
  MatchingAnswer,
  QuizState,
  QuizAttempt,
  QuizAttemptStatus,
} from './types';
