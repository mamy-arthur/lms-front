import { z } from 'zod';

export const quizSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(255),
  description: z.string().nullable().optional(),
});

export type QuizFormValues = z.infer<typeof quizSchema>;
