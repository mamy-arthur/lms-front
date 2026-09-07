import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { questionBankKeys } from '@/shared/queries/keys';
import type { CreateQuizPayload } from '../types';

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuizPayload) => questionBanksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionBankKeys.lists() });
    },
  });
}
