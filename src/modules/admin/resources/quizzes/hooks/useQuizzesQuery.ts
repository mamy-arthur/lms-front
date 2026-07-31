import { useQuery } from '@tanstack/react-query';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { questionBankKeys } from '@/shared/queries/keys';
// import type { QuizSearchParams } from '../types';
import { normalizeQuiz } from '../types';

export const ADMIN_QUIZZES_QUERY_KEY = questionBankKeys.lists();

export function useQuizzesQuery() {
  return useQuery({
    queryKey: questionBankKeys.lists(),
    queryFn: async () => {
      const res = await questionBanksApi.list();
      return {
        data: res.data.map((raw) => normalizeQuiz(raw as unknown as Record<string, unknown>)),
        total: res.data.length,
      };
    },
    placeholderData: (prev) => prev,
  });
}
