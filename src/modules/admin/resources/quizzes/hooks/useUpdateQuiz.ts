import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { questionBankKeys } from '@/shared/queries/keys';
import type { UpdateQuizPayload } from '../types';

export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuizPayload }) =>
      questionBanksApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionBankKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionBankKeys.detail(variables.id) });
    },
  });
}
