import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quizItemsApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';
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
    },
  });
}
