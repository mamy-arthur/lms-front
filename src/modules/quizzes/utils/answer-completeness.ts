import type { Question, TraineeAnswer } from '../types';

export function isQuestionAnswered(question: Question, answer: TraineeAnswer | undefined): boolean {
  switch (question.type) {
    case 'true_false':
      return typeof answer === 'boolean';
    case 'single_choice':
      return typeof answer === 'string' && answer.length > 0;
    case 'multiple_choice':
      return answer instanceof Set && answer.size > 0;
    case 'matching': {
      if (!answer || typeof answer !== 'object' || answer instanceof Set) return false;
      return question.pairs.length > 0 && question.pairs.every((pair) => Boolean(answer[pair.id]));
    }
    default:
      return false;
  }
}
