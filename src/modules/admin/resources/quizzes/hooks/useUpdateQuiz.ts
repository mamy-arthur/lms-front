import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Quiz, UpdateQuizPayload } from "../types";
import { normalizeQuiz } from "../types";
import { ADMIN_QUIZZES_QUERY_KEY } from "./useQuizzesQuery";

export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuizPayload }) => {
      const mockRaw: Record<string, unknown> = {
        id,
        title: data.title,
        slug: data.slug,
        description: data.description ?? "",
        isFinalEvaluation: data.is_final_evaluation,
        formationId: data.formation_id,
        tenantId: data.tenant_id,
        updatedAt: new Date().toISOString(),
      };
      return Promise.resolve({ data: mockRaw });
    },
    onSuccess: ({ data: rawQuiz }) => {
      const updated = normalizeQuiz(
        rawQuiz as unknown as Record<string, unknown>,
      );
      queryClient.setQueryData<{ data: Quiz[]; total: number }>(
        ADMIN_QUIZZES_QUERY_KEY,
        (prev) => ({
          data: (prev?.data ?? []).map((q) =>
            q.id === updated.id ? updated : q,
          ),
          total: prev?.total ?? 0,
        }),
      );
    },
  });
}
