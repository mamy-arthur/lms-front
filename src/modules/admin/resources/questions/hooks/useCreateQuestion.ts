import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { questionBanksApi } from '@/shared/api/question-banks.api';
import { quizItemKeys } from '@/shared/queries/keys';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { QuestionPayload } from '../types';
import { normalizeQuestion } from '../types';

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuestionPayload) => {
      const {
        questionBankId,
        type,
        question,
        commentIfCorrect,
        commentIfIncorrect,
        correctAnswer,
        options,
        pairs,
      } = payload;
      const base = {
        question,
        comment_if_correct: commentIfCorrect,
        comment_if_incorrect: commentIfIncorrect,
      };
      if (type === 'multiple_choice' || type === 'single_choice') {
        return questionBanksApi.createQuizItem(questionBankId, {
          ...base,
          type,
          options: options.map((o) => ({
            ...(o.id ? { id: o.id } : {}),
            label: o.label,
            is_correct: o.isCorrect,
          })),
        });
      }
      if (type === 'true_false') {
        return questionBanksApi.createQuizItem(questionBankId, {
          ...base,
          type,
          correct_answer: correctAnswer,
        });
      }
      return questionBanksApi.createQuizItem(questionBankId, {
        ...base,
        type: 'matching',
        pairs: pairs.map((p) => ({ left: p.left, right: p.right })),
      });
    },
    onSuccess: (api, variables) => {
      queryClient.invalidateQueries({
        queryKey: quizItemKeys.listByBank(variables.questionBankId),
      });
      const newQuestion = normalizeQuestion(api);
      toast.success('Question créée.');
      return newQuestion;
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la création.'));
    },
  });
}
