import { useQuery } from '@tanstack/react-query';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';
import type { QuestionSearchParams } from '../types';
import { normalizeQuestion } from '../types';

export const ADMIN_QUESTIONS_QUERY_KEY = quizItemKeys.all;

export function useQuestionsQuery(questionBankId: string, params?: QuestionSearchParams) {
  return useQuery({
    queryKey: quizItemKeys.listByBank(questionBankId, params),
    queryFn: async () => {
      const res = await questionBanksApi.listQuizzes(questionBankId, {
        types: params?.types || undefined,
        competency_ids: params?.competency_ids || undefined,
        q: params?.q,
        sort_by: params?.sort_by,
        sort_order: params?.sort_dir,
        page: params?.page !== undefined ? (params.page ?? 0) + 1 : undefined,
        per_page: params?.page_size,
      });
      const data = res.data.map(normalizeQuestion);
      const meta = res.meta;
      return {
        data,
        total: meta?.total ?? data.length,
        bankCompetencyIds: meta?.competency_ids ?? [],
      };
    },
    enabled: !!questionBankId,
    placeholderData: (prev) => prev,
  });
}
