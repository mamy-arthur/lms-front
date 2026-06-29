import { z } from "zod";
import type { QuestionPayload } from "../types";

const optionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Libellé requis"),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

const pairSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question requise"),
  answer: z.string().min(1, "Réponse requise"),
});

export const formSchema = z
  .object({
    type: z.string().min(1, "Type requis"),
    name: z.string().min(1, "Nom requis").max(255),
    text: z.string().min(1, "Texte requis"),
    generalFeedback: z.string(),
    referenceNumber: z.string(),
    isActive: z.boolean(),
    hasDuration: z.boolean(),
    durationValue: z.union([z.string(), z.number()]).optional(),
    durationUnit: z.string().optional(),
    moduleId: z.string(),
    correctAnswer: z.boolean(),
    feedbackTrue: z.string(),
    feedbackFalse: z.string(),
    options: z.array(optionSchema),
    pairs: z.array(pairSchema),
  })
  .superRefine((data, ctx) => {
    if (data.type === "single_choice" || data.type === "multiple_choice") {
      if (data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ajoutez au moins 2 choix",
          path: ["options"],
        });
      }
    }
    if (data.type === "single_choice") {
      const correctCount = data.options.filter((o) => o.score >= 100).length;
      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un seul choix doit avoir un score de 100%",
          path: ["options"],
        });
      }
    }
    if (data.type === "matching") {
      if (data.pairs.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ajoutez au moins 2 paires",
          path: ["pairs"],
        });
      }
    }
  });

export type FormValues = z.infer<typeof formSchema>;

export function buildQuestionPayload(
  values: FormValues,
  quizId: string,
): QuestionPayload {
  return {
    quizId,
    name: values.name,
    text: values.text,
    type: values.type,
    generalFeedback: values.generalFeedback,
    referenceNumber: values.referenceNumber,
    isActive: values.isActive,
    duration: values.hasDuration
      ? {
          value: Number(values.durationValue),
          unit: values.durationUnit ?? "minute",
        }
      : null,
    moduleId: values.moduleId,
    correctAnswer: values.correctAnswer,
    feedbackTrue: values.feedbackTrue,
    feedbackFalse: values.feedbackFalse,
    options: values.options,
    pairs: values.pairs,
  };
}

export function getCreateDefaults(): FormValues {
  return {
    type: "",
    name: "",
    text: "",
    generalFeedback: "",
    referenceNumber: "",
    isActive: true,
    hasDuration: false,
    durationValue: "",
    durationUnit: "minute",
    moduleId: "",
    correctAnswer: true,
    feedbackTrue: "",
    feedbackFalse: "",
    options: [],
    pairs: [],
  };
}
