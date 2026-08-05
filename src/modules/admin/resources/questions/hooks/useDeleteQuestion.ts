import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { quizItemsApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';
import { getApiErrorMessage } from '@/shared/lib/errors';

export function useDeleteQuestion(questionBankId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => quizItemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizItemKeys.listByBank(questionBankId) });
      toast.success('Question supprimée.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la suppression.'));
    },
  });
}
