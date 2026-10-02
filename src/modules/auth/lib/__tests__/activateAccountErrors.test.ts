import { mapActivateAccountError } from '../activateAccountErrors';

/** Reproduit l'erreur levée par httpClient : Error enrichi de status/headers/json. */
function apiError(status: number, json: unknown, headers: Record<string, string> = {}): unknown {
  return Object.assign(new Error('Error'), {
    status,
    headers: new Headers(headers),
    body: JSON.stringify(json),
    json,
  });
}

describe('mapActivateAccountError', () => {
  it('reconnaît un jeton refusé à l’erreur de validation sur `token`', () => {
    const err = apiError(422, {
      message: "Ce lien d'activation est invalide ou a expiré.",
      errors: { token: ["Ce lien d'activation est invalide ou a expiré."] },
    });

    const mapped = mapActivateAccountError(err);

    expect(mapped.kind).toBe('invalid_token');
    expect(mapped.message).toBe("Ce lien d'activation est invalide ou a expiré.");
  });

  it('retombe sur un message métier quand l’API n’en fournit aucun', () => {
    const err = apiError(422, { errors: { token: [] as string[] } });

    expect(mapActivateAccountError(err).kind).not.toBe('invalid_token');
  });

  it('classe un 422 portant sur le mot de passe en validation, pas en jeton invalide', () => {
    const err = apiError(422, {
      message: 'Erreur',
      errors: { password: ['Le mot de passe est trop court.'] },
    });

    const mapped = mapActivateAccountError(err);

    expect(mapped.kind).toBe('validation');
    expect(mapped.message).toBe('Le mot de passe est trop court.');
  });

  it('classe un 429 en throttled', () => {
    const err = apiError(429, { message: 'Trop de demandes' }, { 'Retry-After': '45' });

    expect(mapActivateAccountError(err).kind).toBe('throttled');
  });

  it('classe un 500 en indisponibilité', () => {
    expect(mapActivateAccountError(apiError(500, {})).kind).toBe('unavailable');
  });

  it('classe une absence de réponse en erreur réseau', () => {
    expect(mapActivateAccountError(new Error('Failed to fetch')).kind).toBe('network');
  });
});
