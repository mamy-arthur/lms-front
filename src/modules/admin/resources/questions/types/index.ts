import type {
  ApiQuizItem,
  ApiQuizItemChoices,
  ApiQuizItemTrueFalse,
  ApiQuizItemMatching,
  CreateQuizItemPayload,
  UpdateQuizItemPayload,
} from '@/shared/types/question-bank.types';

import type {
  Question,
  QuestionType,
  QuestionOption,
  MatchingPair,
  Duration,
} from '@/modules/shared/lib/question-types';

export type {
  Question,
  QuestionType,
  QuestionOption,
  MatchingPair,
  Duration,
  CreateQuizItemPayload,
  UpdateQuizItemPayload,
};

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
        weightPercentage: o.weight_percentage ?? 0,
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
  options: { id?: string; label: string; isCorrect: boolean; weightPercentage?: number }[];
  pairs: { left: string; right: string; weightPercentage: number }[];
}

export type UpdateQuestionPayload = Omit<QuestionPayload, 'questionBankId' | 'type'>;

export interface QuestionSearchParams {
  q?: string;
  types?: string;
  competency_ids?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

type BasePayload = Pick<
  QuestionPayload,
  'question' | 'commentIfCorrect' | 'commentIfIncorrect' | 'competency_id'
>;

function buildBaseApiBody(payload: BasePayload) {
  return {
    question: payload.question,
    comment_if_correct: payload.commentIfCorrect,
    comment_if_incorrect: payload.commentIfIncorrect,
    competency_id: payload.competency_id,
  };
}

/** Transforms a QuestionPayload into the body expected by the create API endpoint. */
export function toApiCreateBody(payload: QuestionPayload): CreateQuizItemPayload {
  const base = buildBaseApiBody(payload);
  const { type, options, pairs, correctAnswer } = payload;
  if (type === 'multiple_choice' || type === 'single_choice') {
    return {
      ...base,
      type,
      options: options.map((o) => ({
        ...(o.id ? { id: o.id } : {}),
        label: o.label,
        is_correct: o.isCorrect,
        ...(type === 'multiple_choice' ? { weight_percentage: o.weightPercentage ?? 0 } : {}),
      })),
    };
  }
  if (type === 'true_false') {
    return { ...base, type, correct_answer: correctAnswer };
  }
  return {
    ...base,
    type: 'matching',
    pairs: pairs.map((p) => ({
      left: p.left,
      right: p.right,
    })),
  };
}

/** Transforms an UpdateQuestionPayload into the body expected by the update API endpoint. */
export function toApiUpdateBody(
  data: UpdateQuestionPayload & { type?: string },
): UpdateQuizItemPayload {
  const base = buildBaseApiBody(data);
  const { type, options, pairs, correctAnswer } = data;
  if (!type || type === 'multiple_choice' || type === 'single_choice') {
    return {
      ...base,
      options: options.map((o) => ({
        ...(o.id ? { id: o.id } : {}),
        label: o.label,
        is_correct: o.isCorrect,
        ...(type === 'multiple_choice' ? { weight_percentage: o.weightPercentage ?? 0 } : {}),
      })),
    };
  }
  if (type === 'true_false') {
    return { ...base, correct_answer: correctAnswer };
  }
  return {
    ...base,
    pairs: pairs.map((p) => ({
      left: p.left,
      right: p.right,
    })),
  };
}
