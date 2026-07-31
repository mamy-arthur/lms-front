import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { questionBankKeys } from '@/shared/queries/keys';
import { getApiErrorMessage } from '@/shared/lib/errors';

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionBanksApi.deactivate(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: questionBankKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionBankKeys.detail(id) });
      toast.success('Banque désactivée.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la désactivation.'));
    },
  });
}
