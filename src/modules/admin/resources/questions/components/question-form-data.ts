import { z } from 'zod';
import type { QuestionPayload } from '../types';

const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Libellé requis'),
  isCorrect: z.boolean(),
});

const pairSchema = z.object({
  left: z.string().min(1, 'Gauche requis'),
  right: z.string().min(1, 'Droite requise'),
});

export const formSchema = z
  .object({
    type: z.string().min(1, 'Type requis'),
    competencyId: z.string().min(1, 'Module requis'),
    question: z.string().min(1, 'Question requise'),
    commentIfCorrect: z.string().nullable().optional(),
    commentIfIncorrect: z.string().nullable().optional(),
    correctAnswer: z.boolean(),
    options: z.array(optionSchema),
    pairs: z.array(pairSchema),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'single_choice' || data.type === 'multiple_choice') {
      if (data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ajoutez au moins 2 choix',
          path: ['options'],
        });
      }
    }
    if (data.type === 'single_choice') {
      const correctCount = data.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Exactement un choix doit être correct',
          path: ['options'],
        });
      }
    }
    if (data.type === 'multiple_choice') {
      const correctCount = data.options.filter((o) => o.isCorrect).length;
      if (correctCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Au moins un choix doit être correct',
          path: ['options'],
        });
      }
    }
    if (data.type === 'matching') {
      if (data.pairs.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ajoutez au moins 2 paires',
          path: ['pairs'],
        });
      }
    }
  });

export type FormValues = z.infer<typeof formSchema>;

export function buildQuestionPayload(values: FormValues, questionBankId: string): QuestionPayload {
  return {
    questionBankId,
    type: values.type,
    competency_id: values.competencyId,
    question: values.question,
    commentIfCorrect: values.commentIfCorrect ?? null,
    commentIfIncorrect: values.commentIfIncorrect ?? null,
    correctAnswer: values.correctAnswer,
    options: values.options.map((o) => ({
      ...(o.id ? { id: o.id } : {}),
      label: o.label,
      isCorrect: o.isCorrect,
    })),
    pairs: values.pairs.map((p) => ({
      left: p.left,
      right: p.right,
      weight_percentage: Math.round(100 / values.pairs.length),
    })),
  };
}

export function getCreateDefaults(): FormValues {
  return {
    type: '',
    competencyId: '',
    question: '',
    commentIfCorrect: null,
    commentIfIncorrect: null,
    correctAnswer: true,
    options: [],
    pairs: [],
  };
}
