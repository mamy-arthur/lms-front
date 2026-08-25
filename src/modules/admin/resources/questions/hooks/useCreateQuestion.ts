import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import type { ApiQuizItem } from '@/shared/types/question-bank.types';
import { quizItemKeys } from '@/shared/queries/keys';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { QuestionPayload } from '../types';
import { normalizeQuestion, toApiCreateBody } from '../types';

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuestionPayload) =>
      questionBanksApi.createQuizItem(payload.questionBankId, toApiCreateBody(payload)),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: quizItemKeys.listByBank(variables.questionBankId),
      });
      const api = ((response as unknown as { data: ApiQuizItem }).data ?? response) as ApiQuizItem;
      const newQuestion = normalizeQuestion(api);
      toast.success('Question créée.');
      return newQuestion;
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la création.'));
    },
  });
}
