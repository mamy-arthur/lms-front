import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';

export function evaluationAttempt(
  overrides: Partial<ApiEvaluationAttempt> = {},
): ApiEvaluationAttempt {
  return {
    id: 'attempt-1',
    evaluation_id: 'evaluation-1',
    enrollment_id: 'enrollment-1',
    node_execution_id: 'visit-1',
    validation_round_id: 'round-1',
    status: 'in_progress',
    score: null,
    started_at: '2026-10-01T12:00:00.000Z',
    completed_at: null,
    server_now: '2026-10-01T12:00:00.000Z',
    expires_at: null,
    time_limit_minutes: null,
    completion_reason: null,
    page_session_id: null,
    quizzes: [
      {
        id: 'question-1',
        quiz_id: 'quiz-1',
        position: 1,
        points: 1,
        type: 'multiple_choice',
        question: 'Choisissez vos réponses',
        options: [
          { id: 'a', label: 'Option A' },
          { id: 'b', label: 'Option B' },
        ],
        submitted_answer: null,
        answer_revision: 0,
      },
    ],
    ...overrides,
  };
}
