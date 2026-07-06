import { useQuery } from '@tanstack/react-query';
import { MOCK_QUESTIONS } from '@modules/shared/components/questions/mocks/questions.mock';
import type { Question, QuestionSearchParams } from '../types';
import { normalizeQuestion } from '../types';

export const ADMIN_QUESTIONS_QUERY_KEY = ['admin', 'questions'] as const;

export function useQuestionsQuery(params?: QuestionSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_QUESTIONS_QUERY_KEY, params],
    queryFn: () => {
      const data: Question[] = MOCK_QUESTIONS.map((q) => normalizeQuestion(q));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
