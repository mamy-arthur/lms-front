import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizItemsApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';

export function useDeleteQuestion(questionBankId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quizItemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizItemKeys.listByBank(questionBankId) });
    },
  });
}
