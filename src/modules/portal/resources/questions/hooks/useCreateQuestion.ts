import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Question, QuestionPayload } from "../types";
import { normalizeQuestion } from "../types";
import { PORTAL_QUESTIONS_QUERY_KEY } from "./useQuestionsQuery";

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuestionPayload) => {
      const mockRaw: Record<string, unknown> = {
        id: `q-${Date.now()}`,
        quiz_id: data.quizId,
        name: data.name,
        text: data.text,
        type: data.type,
        general_feedback: data.generalFeedback,
        identification_number: data.identificationNumber,
        is_active: data.isActive,
        duration: data.duration,
        module_id: data.moduleId,
        correct_answer: data.correctAnswer,
        feedback_true: data.feedbackTrue,
        feedback_false: data.feedbackFalse,
        options: data.options.map((o) => ({
          id: o.id,
          label: o.label,
          is_correct: o.isCorrect,
          score: o.score,
          feedback: o.feedback,
        })),
        pairs: data.pairs.map((p) => ({
          id: p.id,
          question: p.question,
          answer: p.answer,
        })),
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve({ data: mockRaw });
    },
    onSuccess: ({ data: rawQuestion }) => {
      const newQuestion = normalizeQuestion(
        rawQuestion as unknown as Record<string, unknown>,
      );
      queryClient.setQueryData<{ data: Question[]; total: number }>(
        PORTAL_QUESTIONS_QUERY_KEY,
        (prev) => ({
          data: [newQuestion, ...(prev?.data ?? [])],
          total: (prev?.total ?? 0) + 1,
        }),
      );
    },
  });
}
