import { mapPasswordResetError } from '../passwordResetErrors';

/** httpClient construit l'erreur avec `new Error(res.statusText)` : le reproduire fidèlement. */
const STATUS_TEXT: Record<number, string> = {
  422: 'Unprocessable Content',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

/** Reproduit l'erreur levée par httpClient : Error enrichi de status/headers/json. */
function apiError(status: number, json: unknown, headers: Record<string, string> = {}): unknown {
  return Object.assign(new Error(STATUS_TEXT[status] ?? 'Error'), {
    status,
    headers: new Headers(headers),
    body: JSON.stringify(json),
    json,
  });
}

describe('mapPasswordResetError — discrimination par error_code', () => {
  it.each([
    ['password_reset.invalid_token', 'invalid_token'],
    ['password_reset.invalid_password', 'invalid_password'],
  ])('%s est reconnu comme %s', (errorCode, expectedKind) => {
    const err = apiError(422, { message: 'Message traduit', error_code: errorCode });

    expect(mapPasswordResetError(err).kind).toBe(expectedKind);
  });

  it('prime sur le statut, qui ne suffit pas à distinguer les trois cas de 422', () => {
    const invalidToken = apiError(422, { error_code: 'password_reset.invalid_token' });
    const invalidPassword = apiError(422, { error_code: 'password_reset.invalid_password' });
    const validation = apiError(422, { errors: { email: ['Email invalide'] } });

    expect(mapPasswordResetError(invalidToken).kind).toBe('invalid_token');
    expect(mapPasswordResetError(invalidPassword).kind).toBe('invalid_password');
    expect(mapPasswordResetError(validation).kind).toBe('validation');
  });

  it('remonte le message traduit par l’API', () => {
    const err = apiError(422, {
      message: 'Ce lien a déjà été utilisé.',
      error_code: 'password_reset.invalid_token',
    });

    expect(mapPasswordResetError(err).message).toBe('Ce lien a déjà été utilisé.');
  });

  it('retombe sur un message métier quand l’API n’en fournit aucun', () => {
    const err = apiError(422, { error_code: 'password_reset.invalid_token' });

    expect(mapPasswordResetError(err).message).toBe(
      'Ce lien est invalide, a expiré ou a déjà été utilisé.',
    );
  });
});

describe('mapPasswordResetError — repli sur le statut', () => {
  it('classe un 422 sans error_code en validation', () => {
    const err = apiError(422, { message: 'Erreur', errors: { email: ['Email invalide'] } });

    expect(mapPasswordResetError(err).kind).toBe('validation');
    expect(mapPasswordResetError(err).message).toBe('Email invalide');
  });

  it('classe un 429 en throttled et expose le Retry-After', () => {
    const err = apiError(429, { message: 'Trop de demandes' }, { 'Retry-After': '45' });
    const mapped = mapPasswordResetError(err);

    expect(mapped.kind).toBe('throttled');
    expect(mapped.retryAfterSeconds).toBe(45);
    expect(mapped.message).toBe('Trop de demandes. Réessayez dans 45 secondes.');
  });

  it('formate un Retry-After long en minutes', () => {
    const err = apiError(429, { message: 'Trop de demandes' }, { 'Retry-After': '90' });

    expect(mapPasswordResetError(err).message).toBe('Trop de demandes. Réessayez dans 2 minutes.');
  });

  it('classe un 429 sans Retry-After en throttled sans délai', () => {
    const mapped = mapPasswordResetError(apiError(429, { message: 'Trop de demandes' }));

    expect(mapped.kind).toBe('throttled');
    expect(mapped.retryAfterSeconds).toBeUndefined();
  });

  it('classe un 5xx en unavailable', () => {
    expect(mapPasswordResetError(apiError(503, { message: 'Service indisponible' })).kind).toBe(
      'unavailable',
    );
  });

  it('classe une absence de réponse en network', () => {
    expect(mapPasswordResetError(new TypeError('Failed to fetch')).kind).toBe('network');
  });
});

describe('mapPasswordResetError — messages imposés', () => {
  it.each([
    [
      'network',
      new TypeError('Failed to fetch'),
      'Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.',
    ],
    [
      'unavailable',
      apiError(500, { message: 'Undefined variable $tenant' }),
      'Le service est momentanément indisponible. Réessayez dans quelques instants.',
    ],
  ])('n’expose pas le corps de la réponse pour un cas %s', (_kind, err, expected) => {
    // Une stack trace ou un message d'infrastructure n'a rien à faire dans l'UI.
    expect(mapPasswordResetError(err).message).toBe(expected);
  });
});
