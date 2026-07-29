import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { quizItemsApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { UpdateQuestionPayload } from '../types';

export function useUpdateQuestion(questionBankId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionPayload }) => {
      const {
        type,
        question,
        commentIfCorrect,
        commentIfIncorrect,
        correctAnswer,
        options,
        pairs,
      } = data as UpdateQuestionPayload & { type?: string };
      const base = {
        question,
        comment_if_correct: commentIfCorrect,
        comment_if_incorrect: commentIfIncorrect,
      };
      if (!type || type === 'multiple_choice' || type === 'single_choice') {
        return quizItemsApi.update(id, {
          ...base,
          options: options.map((o) => ({
            ...(o.id ? { id: o.id } : {}),
            label: o.label,
            is_correct: o.isCorrect,
          })),
        });
      }
      if (type === 'true_false') {
        return quizItemsApi.update(id, { ...base, correct_answer: correctAnswer });
      }
      return quizItemsApi.update(id, {
        ...base,
        pairs: pairs.map((p) => ({ left: p.left, right: p.right })),
      });
    },
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
