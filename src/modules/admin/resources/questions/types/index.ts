export type {
  Question,
  QuestionType,
  QuestionOption,
  MatchingPair,
  Duration,
} from '@/modules/shared/lib/normalizers';
export { normalizeQuestion } from '@/modules/shared/lib/normalizers';

export interface QuestionPayload {
  quizId: string;
  name: string;
  text: string;
  type: string;
  generalFeedback: string;
  referenceNumber: string;
  isActive: boolean;
  duration: { value: number; unit: string } | null;
  moduleId: string;
  correctAnswer: boolean;
  feedbackTrue: string;
  feedbackFalse: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    score: number;
    feedback: string;
  }[];
  pairs: { id: string; question: string; answer: string }[];
}

export type UpdateQuestionPayload = QuestionPayload;

export interface QuestionSearchParams {
  q?: string;
  quiz_id?: string;
  type?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
