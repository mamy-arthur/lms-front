import type {
  ApiQuizItem,
  ApiQuizItemChoices,
  ApiQuizItemTrueFalse,
  ApiQuizItemMatching,
} from '@/shared/types/question-bank.types';
import type { Question, QuestionType } from '@/modules/shared/lib/normalizers';

export type {
  Question,
  QuestionType,
  QuestionOption,
  MatchingPair,
  Duration,
} from '@/modules/shared/lib/normalizers';

/**
 * Maps a Quiz item from the platform API (module 10) to the shared Question type
 * used by the admin questions table and form modal.
 */
export function normalizeQuestion(api: ApiQuizItem): Question {
  const base = {
    id: api.id,
    quizId: api.question_bank_id,
    type: api.type as QuestionType,
    text: api.question,
    referenceNumber: api.idnumber,
    updatedAt: api.updated_at,
    // Fields not present in the new API — set sensible defaults
    name: (api.question ?? '').replace(/<[^>]*>/g, '').slice(0, 80),
    generalFeedback: '',
    isActive: true,
    duration: null,
    competencyId: api.competency_id ?? '',
    feedbackTrue: api.comment_if_correct ?? '',
    feedbackFalse: api.comment_if_incorrect ?? '',
  };

  if (api.type === 'multiple_choice' || api.type === 'single_choice') {
    const a = api as ApiQuizItemChoices;
    return {
      ...base,
      correctAnswer: false,
      options: a.options.map((o) => ({
        id: o.id,
        label: o.label,
        isCorrect: o.is_correct,
        score: o.is_correct ? 100 : 0,
        feedback: '',
      })),
      pairs: [],
    };
  }

  if (api.type === 'true_false') {
    const a = api as ApiQuizItemTrueFalse;
    return { ...base, correctAnswer: a.correct_answer, options: [], pairs: [] };
  }

  // matching
  const a = api as ApiQuizItemMatching;
  return {
    ...base,
    correctAnswer: false,
    options: [],
    pairs: a.pairs.map((p, i) => ({
      id: String(i),
      question: p.left,
      answer: p.right,
    })),
  };
}

export interface QuestionPayload {
  questionBankId: string;
  type: string;
  competency_id: string;
  question: string;
  commentIfCorrect: string | null;
  commentIfIncorrect: string | null;
  correctAnswer: boolean;
  options: { id?: string; label: string; isCorrect: boolean }[];
  pairs: { left: string; right: string }[];
}

export type UpdateQuestionPayload = Omit<QuestionPayload, 'questionBankId' | 'type'>;

export interface QuestionSearchParams {
  q?: string;
  type?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
