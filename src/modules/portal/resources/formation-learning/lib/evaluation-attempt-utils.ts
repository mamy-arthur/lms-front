import { normalizeQuestion } from '@/modules/shared/lib/question-types';
import type { ApiAttemptQuiz } from '@/shared/types/evaluation-attempt.types';
import type { MatchingAnswer, MultipleChoiceAnswer, TraineeAnswer } from '@/modules/quizzes/types';
import type { Question } from '@/modules/shared/lib/question-types';

export function makeSessionId() {
  return 'EV-' + Math.random().toString(16).slice(2, 6).toUpperCase() + '-2026';
}

export function normalizeAttemptQuiz(q: ApiAttemptQuiz): Question {
  if (q.type === 'matching') {
    // Build pairs directly — do NOT go through normalizeQuestion to avoid double-mapping issues
    const leftValues = q.left_values ?? [];
    const rightValues = q.right_values ?? [];
    return {
      id: q.id,
      quizId: q.quiz_id,
      name: '',
      text: q.question,
      type: 'matching',
      generalFeedback: '',
      referenceNumber: '',
      isActive: true,
      duration: null,
      competencyId: '',
      correctAnswer: false,
      feedbackTrue: '',
      feedbackFalse: '',
      options: [],
      pairs: leftValues.map((left, i) => ({
        id: String(i),
        question: left,
        answer: rightValues[i] ?? '',
      })),
      updatedAt: '',
    };
  }

  return normalizeQuestion({
    id: q.id,
    quiz_id: q.quiz_id,
    type: q.type,
    text: q.question,
    options: (q.options ?? []).map((o) => ({ id: o.id, label: o.label, is_correct: false })),
    pairs: [],
    correct_answer: false,
  });
}

export function toApiPayload(quiz: ApiAttemptQuiz, answer: TraineeAnswer): Record<string, unknown> {
  if (
    answer == null ||
    (answer instanceof Set && answer.size === 0) ||
    (typeof answer === 'object' &&
      !(answer instanceof Set) &&
      Object.values(answer).every((value) => !value)) ||
    answer === ''
  )
    return { clear: true };
  switch (quiz.type) {
    case 'single_choice':
      return { selected_option_ids: answer ? [answer as string] : [] };
    case 'multiple_choice':
      return { selected_option_ids: [...(answer as MultipleChoiceAnswer)] };
    case 'true_false':
      return { answer: answer as boolean };
    case 'matching': {
      const mapping = answer as MatchingAnswer; // leftIdx → rightIdx (both as string indices)
      const leftValues = quiz.left_values ?? [];
      const rightValues = quiz.right_values ?? [];
      return {
        pairs: Object.entries(mapping)
          .filter(([, rightIdx]) => rightIdx !== '')
          .map(([leftIdx, rightIdx]) => ({
            left: leftValues[Number(leftIdx)] ?? '',
            right: rightValues[Number(rightIdx)] ?? '',
          })),
      };
    }
    default:
      return {};
  }
}

/** Hydrate saved drafts without inventing a correct answer or discarding false. */
export function fromApiAnswer(quiz: ApiAttemptQuiz): TraineeAnswer {
  const value = quiz.submitted_answer as {
    selected_option_ids?: string[];
    answer?: boolean;
    pairs?: { left: string; right: string }[];
  } | null;
  if (!value) return null;
  switch (quiz.type) {
    case 'single_choice':
      return value.selected_option_ids?.[0] ?? null;
    case 'multiple_choice':
      return new Set(value.selected_option_ids ?? []);
    case 'true_false':
      return value.answer ?? null;
    case 'matching':
      return Object.fromEntries(
        (value.pairs ?? []).flatMap(({ left, right }) => {
          const l = quiz.left_values?.indexOf(left) ?? -1;
          const r = quiz.right_values?.indexOf(right) ?? -1;
          return l >= 0 && r >= 0 ? [[String(l), String(r)]] : [];
        }),
      );
  }
}
