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
        pairs: Object.entries(mapping).map(([leftIdx, rightIdx]) => ({
          left: leftValues[Number(leftIdx)] ?? '',
          right: rightValues[Number(rightIdx)] ?? '',
        })),
      };
    }
    default:
      return {};
  }
}
