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
      const res = await questionBanksApi.listQuizzes(
        questionBankId,
        params?.type ? { type: params.type } : undefined,
      );
      const data = res.data.map(normalizeQuestion);
      return { data, total: data.length };
    },
    enabled: !!questionBankId,
    placeholderData: (prev) => prev,
  });
}
