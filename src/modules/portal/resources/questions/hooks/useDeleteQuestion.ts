import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Question } from "../types";
import { PORTAL_QUESTIONS_QUERY_KEY } from "./useQuestionsQuery";

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return Promise.resolve({ id });
    },
    onSuccess: ({ id }) => {
      queryClient.setQueryData<{ data: Question[]; total: number }>(
        PORTAL_QUESTIONS_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).filter((q) => q.id !== id),
          total: (prev?.total ?? 1) - 1,
        }),
      );
    },
  });
}
