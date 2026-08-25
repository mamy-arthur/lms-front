import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { quizItemsApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { UpdateQuestionPayload } from '../types';
import { toApiUpdateBody } from '../types';

export function useUpdateQuestion(questionBankId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionPayload & { type?: string } }) =>
      quizItemsApi.update(id, toApiUpdateBody(data)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quizItemKeys.listByBank(questionBankId) });
      queryClient.invalidateQueries({ queryKey: quizItemKeys.detail(variables.id) });
      toast.success('Question mise à jour.');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la mise à jour.'));
    },
  });
}
