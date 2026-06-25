import { MOCK_QUESTIONS } from "@modules/shared/components/questions/mocks/questions.mock";
import { useQuery } from "@tanstack/react-query";
import type { Question } from "../types";
import { normalizeQuestion } from "../types";

export const PORTAL_QUESTIONS_QUERY_KEY = ["portal", "questions"] as const;

export function useQuestionsQuery() {
  return useQuery({
    queryKey: PORTAL_QUESTIONS_QUERY_KEY,
    queryFn: () => {
      const data: Question[] = MOCK_QUESTIONS.map((q) => normalizeQuestion(q));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
