export const MAX_EVALUATION_TIME_LIMIT_MINUTES = 2147483647;

export function isValidEvaluationTimeLimit(value: number | null): boolean {
  return (
    value === null ||
    (Number.isInteger(value) && value >= 1 && value <= MAX_EVALUATION_TIME_LIMIT_MINUTES)
  );
}

export function evaluationTimeLimitFromApi(evaluation?: { time_limit_minutes?: number | null }): {
  timeLimitMinutes: number | null;
} {
  return { timeLimitMinutes: evaluation?.time_limit_minutes ?? null };
}

export function evaluationTimeLimitPayload(config: { timeLimitMinutes: number | null }): {
  time_limit_minutes: number | null;
} {
  if (!isValidEvaluationTimeLimit(config.timeLimitMinutes)) {
    throw new Error('La durée doit être un nombre entier de minutes entre 1 et 2147483647.');
  }
  return { time_limit_minutes: config.timeLimitMinutes };
}
