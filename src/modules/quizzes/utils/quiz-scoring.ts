import type { Question, TraineeAnswer, MultipleChoiceAnswer } from '../types';

export function isCorrect(question: Question, answer: TraineeAnswer): boolean {
  switch (question.type) {
    case 'true_false':
      return (answer as boolean | null) === question.correctAnswer;

    case 'single_choice': {
      const selected = answer as string | null;
      const correctOption = question.options.find((o) => o.isCorrect);
      return !!selected && selected === correctOption?.id;
    }

    case 'multiple_choice': {
      const selected = answer as MultipleChoiceAnswer | undefined;
      if (!selected || selected.size === 0) return false;
      const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
      if (selected.size !== correctIds.size) return false;
      for (const id of selected) {
        if (!correctIds.has(id)) return false;
      }
      return true;
    }

    case 'matching': {
      const matched = answer as Record<string, string> | undefined;
      if (!matched) return false;
      return question.pairs.every((p) => matched[p.id] === p.id);
    }

    default:
      return false;
  }
}

export function computeScore(
  questions: Question[],
  answers: Record<string, TraineeAnswer>,
): { pointsObtained: number; maxPoints: number; grade: number } {
  const pointsObtained = questions.filter((q) => isCorrect(q, answers[q.id])).length;
  const maxPoints = questions.length;
  const grade = maxPoints > 0 ? (pointsObtained / maxPoints) * 100 : 0;
  return { pointsObtained, maxPoints, grade };
}
