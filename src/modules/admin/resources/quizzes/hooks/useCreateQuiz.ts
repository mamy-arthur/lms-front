import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateQuizPayload, Quiz } from "../types";
import { normalizeQuiz } from "../types";
import { ADMIN_QUIZZES_QUERY_KEY } from "./useQuizzesQuery";

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuizPayload) => {
      const mockRaw: Record<string, unknown> = {
        id: `quiz-${Date.now()}`,
        title: data.title,
        slug: data.slug,
        description: data.description ?? "",
        isFinalEvaluation: data.is_final_evaluation,
        formationId: data.formation_id,
        questionCount: 0,
        activeQuestionCount: 0,
        tenantId: data.tenant_id,
        updatedAt: new Date().toISOString(),
      };
      return Promise.resolve({ data: mockRaw });
    },
    onSuccess: ({ data: rawQuiz }) => {
      const newQuiz = normalizeQuiz(
        rawQuiz as unknown as Record<string, unknown>,
      );
      queryClient.setQueryData<{ data: Quiz[]; total: number }>(
        ADMIN_QUIZZES_QUERY_KEY,
        (prev) => ({
          data: [newQuiz, ...(prev?.data ?? [])],
          total: (prev?.total ?? 0) + 1,
        }),
      );
    },
  });
}
