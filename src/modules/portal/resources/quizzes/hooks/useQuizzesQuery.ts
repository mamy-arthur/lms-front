import { useQuery } from "@tanstack/react-query";
import { MOCK_QUIZZES } from "@/shared/mocks/quizzes.mock";
import type { Quiz, QuizSearchParams } from "../types";
import { normalizeQuiz } from "../types";

export const PORTAL_QUIZZES_QUERY_KEY = ["portal", "quizzes"] as const;

export function useQuizzesQuery(params?: QuizSearchParams) {
  return useQuery({
    queryKey: [...PORTAL_QUIZZES_QUERY_KEY, params],
    queryFn: () => {
      const data: Quiz[] = MOCK_QUIZZES.map((q) => normalizeQuiz(q));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
