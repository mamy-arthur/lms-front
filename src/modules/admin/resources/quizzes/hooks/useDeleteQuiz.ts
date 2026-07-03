import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQuizzesApi } from '../api';
import type { Quiz } from '../types';
import { ADMIN_QUIZZES_QUERY_KEY } from './useQuizzesQuery';

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminQuizzesApi.remove(id),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<{ data: Quiz[]; total: number }>(
        ADMIN_QUIZZES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).filter((q) => q.id !== deletedId),
          total: (prev?.total ?? 1) - 1,
        }),
      );
    },
  });
}
