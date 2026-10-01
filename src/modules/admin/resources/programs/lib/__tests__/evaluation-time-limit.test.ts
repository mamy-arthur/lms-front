import {
  evaluationTimeLimitFromApi,
  evaluationTimeLimitPayload,
  isValidEvaluationTimeLimit,
} from '../evaluation-time-limit';

describe('Configuration de la durée des évaluations', () => {
  it.each([null, 1, 90, 2147483647])('conserve %s minutes entre API et éditeur', (minutes) => {
    const config = evaluationTimeLimitFromApi({ time_limit_minutes: minutes });
    expect(config.timeLimitMinutes).toBe(minutes);
    expect(evaluationTimeLimitPayload(config)).toEqual({ time_limit_minutes: minutes });
  });

  it('traite une ancienne réponse sans durée comme illimitée', () => {
    expect(evaluationTimeLimitFromApi({})).toEqual({ timeLimitMinutes: null });
    expect(evaluationTimeLimitFromApi()).toEqual({ timeLimitMinutes: null });
  });

  it('envoie explicitement null lors de la suppression de la limite', () => {
    const config = evaluationTimeLimitFromApi({ time_limit_minutes: 90 });
    config.timeLimitMinutes = null;
    expect(evaluationTimeLimitPayload(config)).toEqual({ time_limit_minutes: null });
  });

  it.each([0, -1, 1.5, 2147483648, Number.NaN, Number.POSITIVE_INFINITY])(
    'refuse une limite invalide : %s',
    (minutes) => {
      expect(isValidEvaluationTimeLimit(minutes)).toBe(false);
      expect(() => evaluationTimeLimitPayload({ timeLimitMinutes: minutes })).toThrow();
    },
  );
});
