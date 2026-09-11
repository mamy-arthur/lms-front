import { mapTwoFactorError } from '../twoFactorErrors';

/** Reproduit l'erreur levée par httpClient : Error enrichi de status/headers/json. */
function apiError(status: number, json: unknown, headers: Record<string, string> = {}): unknown {
  return Object.assign(new Error('Error'), {
    status,
    headers: new Headers(headers),
    body: JSON.stringify(json),
    json,
  });
}

describe('mapTwoFactorError — discrimination par error_code', () => {
  it.each([
    ['two_factor.invalid_code', 'invalid_code', 422],
    ['two_factor.invalid_challenge', 'invalid_challenge', 422],
    ['two_factor.expired', 'expired', 422],
    ['two_factor.locked', 'locked', 429],
    ['two_factor.resend_cooldown', 'resend_cooldown', 429],
    ['two_factor.account_locked', 'account_locked', 423],
  ])('%s est reconnu comme %s', (errorCode, expectedKind, status) => {
    const err = apiError(status, { message: 'Message traduit', error_code: errorCode });

    expect(mapTwoFactorError(err).kind).toBe(expectedKind);
  });

  it('prime sur le repli structurel en cas de divergence', () => {
    // Un 422 sans clé `errors` serait classé `expired` par le repli.
    const err = apiError(422, {
      message: 'Challenge inconnu',
      error_code: 'two_factor.invalid_challenge',
    });

    expect(mapTwoFactorError(err).kind).toBe('invalid_challenge');
  });

  it('remonte le message traduit par l’API', () => {
    const err = apiError(422, {
      message: 'Le code fourni est incorrect.',
      error_code: 'two_factor.invalid_code',
    });

    expect(mapTwoFactorError(err).message).toBe('Le code fourni est incorrect.');
  });
});

describe('mapTwoFactorError — repli structurel sans error_code', () => {
  it('classe un 423 en account_locked', () => {
    expect(mapTwoFactorError(apiError(423, { message: 'Compte bloqué' })).kind).toBe(
      'account_locked',
    );
  });

  it('classe un 429 porteur de Retry-After en resend_cooldown', () => {
    const err = apiError(429, { message: 'Patientez' }, { 'Retry-After': '42' });

    expect(mapTwoFactorError(err).kind).toBe('resend_cooldown');
  });

  it('classe un 429 sans Retry-After en throttled', () => {
    expect(mapTwoFactorError(apiError(429, { message: 'Trop de tentatives' })).kind).toBe(
      'throttled',
    );
  });

  it('classe un 422 porteur de errors.code en invalid_code', () => {
    const err = apiError(422, {
      message: 'Le code fourni est incorrect.',
      errors: { code: ['Le code fourni est incorrect.'] },
    });

    expect(mapTwoFactorError(err).kind).toBe('invalid_code');
  });

  it('classe un 422 sans errors en expired', () => {
    expect(mapTwoFactorError(apiError(422, { message: 'Code expiré' })).kind).toBe('expired');
  });

  it('classe un statut inattendu en unknown', () => {
    expect(mapTwoFactorError(apiError(500, { message: 'Boom' })).kind).toBe('unknown');
  });
});

describe('mapTwoFactorError — Retry-After', () => {
  it('extrait la valeur en secondes', () => {
    const err = apiError(
      429,
      { message: 'Patientez', error_code: 'two_factor.resend_cooldown' },
      { 'Retry-After': '58' },
    );

    expect(mapTwoFactorError(err).retryAfterSeconds).toBe(58);
  });

  it('omet le champ quand le header est absent', () => {
    const err = apiError(422, { message: 'Code incorrect', error_code: 'two_factor.invalid_code' });

    expect(mapTwoFactorError(err).retryAfterSeconds).toBeUndefined();
  });

  it('ignore une valeur non numérique', () => {
    const err = apiError(429, { message: 'Patientez' }, { 'Retry-After': 'bientôt' });

    expect(mapTwoFactorError(err).retryAfterSeconds).toBeUndefined();
  });

  it('ignore une valeur négative', () => {
    const err = apiError(429, { message: 'Patientez' }, { 'Retry-After': '-5' });

    expect(mapTwoFactorError(err).retryAfterSeconds).toBeUndefined();
  });
});

describe('mapTwoFactorError — entrées dégradées', () => {
  it('retourne unknown avec un message de repli pour une erreur non HTTP', () => {
    const result = mapTwoFactorError(new Error('Network down'));

    expect(result.kind).toBe('unknown');
    expect(result.message).toBe('Network down');
  });

  it('retourne unknown pour une valeur nulle', () => {
    const result = mapTwoFactorError(null);

    expect(result.kind).toBe('unknown');
    expect(result.message).toBe('Une erreur est survenue. Veuillez réessayer.');
  });
});
