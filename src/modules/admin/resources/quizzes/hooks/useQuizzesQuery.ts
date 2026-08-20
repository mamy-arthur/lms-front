import { useQuery } from '@tanstack/react-query';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { questionBankKeys } from '@/shared/queries/keys';
import type { QuizSearchParams } from '../types';
import { normalizeQuiz } from '../types';

export const ADMIN_QUIZZES_QUERY_KEY = questionBankKeys.lists();

export function useQuizzesQuery(params?: QuizSearchParams) {
  const isPaginated = params !== undefined;
  return useQuery({
    queryKey: isPaginated ? questionBankKeys.list(params) : questionBankKeys.lists(),
    queryFn: async () => {
      const apiParams = isPaginated
        ? {
            page: (params.page ?? 0) + 1,
            per_page: params.page_size ?? 25,
            q: params.q,
            sort_by: params.sort_by,
            sort_order: params.sort_dir,
          }
        : undefined;
      const res = await questionBanksApi.list(apiParams);
      const data = res.data.map((raw) => normalizeQuiz(raw as unknown as Record<string, unknown>));
      return {
        data,
        total: res.meta?.total ?? data.length,
      };
    },
    placeholderData: (prev) => prev,
  });
}
