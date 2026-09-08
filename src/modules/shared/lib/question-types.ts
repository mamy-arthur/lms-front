export type QuestionType = 'true_false' | 'single_choice' | 'multiple_choice' | 'matching';

export interface QuestionOption {
  id: string;
  label: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  weightPercentage?: number;
}

export interface MatchingPair {
  id: string;
  question: string;
  answer: string;
}

export interface Duration {
  value: number;
  unit: 'second' | 'minute' | 'hour' | 'day' | 'week';
}

export interface Question {
  id: string;
  quizId: string;
  name: string;
  text: string;
  type: QuestionType;
  generalFeedback: string;
  referenceNumber: string;
  isActive: boolean;
  duration: Duration | null;
  competencyId: string;
  correctAnswer: boolean;
  feedbackTrue: string;
  feedbackFalse: string;
  options: QuestionOption[];
  pairs: MatchingPair[];
  updatedAt: string;
}

export function normalizeQuestion(raw: Record<string, unknown>): Question {
  const rawOptions = raw.options;
  const rawPairs = raw.pairs;
  const rawDuration = raw.duration;
  return {
    id: String(raw.id ?? raw._id ?? ''),
    quizId: String(raw.quizId ?? raw.quiz_id ?? ''),
    name: String(raw.name ?? ''),
    text: String(raw.text ?? ''),
    type: String(raw.type ?? 'single_choice') as QuestionType,
    generalFeedback: String(raw.generalFeedback ?? raw.general_feedback ?? ''),
    referenceNumber: String(raw.referenceNumber ?? raw.identification_number ?? ''),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    duration:
      rawDuration && typeof rawDuration === 'object'
        ? {
            value: Number((rawDuration as Record<string, unknown>).value ?? 0),
            unit: String(
              (rawDuration as Record<string, unknown>).unit ?? 'minute',
            ) as Duration['unit'],
          }
        : null,
    competencyId: String(raw.competency_id ?? ''),
    correctAnswer: Boolean(raw.correctAnswer ?? raw.correct_answer ?? false),
    feedbackTrue: String(raw.feedbackTrue ?? raw.feedback_true ?? ''),
    feedbackFalse: String(raw.feedbackFalse ?? raw.feedback_false ?? ''),
    options: Array.isArray(rawOptions)
      ? rawOptions.map((o: Record<string, unknown>) => ({
          id: String(o.id ?? ''),
          label: String(o.label ?? ''),
          isCorrect: Boolean(o.isCorrect ?? o.is_correct ?? false),
          score: Number(o.score ?? 0),
          feedback: String(o.feedback ?? ''),
          weightPercentage: Number(o.weightPercentage ?? o.weight_percentage ?? 0),
        }))
      : [],
    pairs: Array.isArray(rawPairs)
      ? rawPairs.map((p: Record<string, unknown>) => ({
          id: String(p.id ?? ''),
          question: String(p.question ?? ''),
          answer: String(p.answer ?? ''),
        }))
      : [],
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  };
}
