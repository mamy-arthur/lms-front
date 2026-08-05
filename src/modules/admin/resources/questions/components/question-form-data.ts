import { z } from 'zod';
import type { QuestionPayload } from '../types';

const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Libellé requis'),
  isCorrect: z.boolean(),
  weightPercentage: z.number().int().optional(),
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

      data.options.forEach((o, i) => {
        const w = o.weightPercentage ?? 0;
        if (o.isCorrect && (w < 0 || w > 100)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Le poids doit être compris entre 0 et 100',
            path: ['options', i, 'weightPercentage'],
          });
        }
        if (!o.isCorrect && (w < -100 || w > 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Le poids doit être compris entre -100 et 0',
            path: ['options', i, 'weightPercentage'],
          });
        }
      });
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

/**
 * Distributes `target` integer points across `weights` proportionally,
 * guaranteeing the result sums to exactly `target` (largest-remainder method).
 */
export function largestRemainder(weights: number[], target: number): number[] {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total === 0) {
    const base = Math.floor(target / weights.length);
    const extra = target - base * weights.length;
    return weights.map((_, i) => base + (i < extra ? 1 : 0));
  }
  const exact = weights.map((w) => (w / total) * target);
  const floored = exact.map(Math.floor);
  const remainder = target - floored.reduce((s, v) => s + v, 0);
  const indices = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .map((x) => x.i);
  const result = [...floored];
  for (let k = 0; k < remainder; k++) result[indices[k]] += 1;
  return result;
}

export function buildQuestionPayload(values: FormValues, questionBankId: string): QuestionPayload {
  // Normalize correct weights so they sum to exactly 100 (largest-remainder method).
  // Incorrect weights are sent as-is — no normalization.
  let resolvedOptions = values.options;
  if (values.type === 'multiple_choice') {
    const correctWeights = values.options
      .filter((o) => o.isCorrect)
      .map((o) => o.weightPercentage ?? 0);
    const normalized = largestRemainder(correctWeights, 100);
    let ci = 0;
    resolvedOptions = values.options.map((o) =>
      o.isCorrect ? { ...o, weightPercentage: normalized[ci++] } : o,
    );
  }

  return {
    questionBankId,
    type: values.type,
    competency_id: values.competencyId,
    question: values.question,
    commentIfCorrect: values.commentIfCorrect ?? null,
    commentIfIncorrect: values.commentIfIncorrect ?? null,
    correctAnswer: values.correctAnswer,
    options: resolvedOptions.map((o) => ({
      ...(o.id ? { id: o.id } : {}),
      label: o.label,
      isCorrect: o.isCorrect,
      ...(values.type === 'multiple_choice' ? { weight_percentage: o.weightPercentage ?? 0 } : {}),
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
