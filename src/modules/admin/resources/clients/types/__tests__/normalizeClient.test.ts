/**
 * Tests unitaires — normalizeClient
 * Le backend peut omettre des champs : la normalisation ne doit jamais
 * laisser remonter undefined dans le composant.
 */

import { normalizeClient } from '../index';

describe('normalizeClient', () => {
  it('conserve les valeurs fournies', () => {
    const client = normalizeClient({
      id: 'c-1',
      tenant_id: 't-1',
      name: 'Globex',
      slug: 'globex',
      is_active: false,
      created_at: '2026-01-01T00:00:00+00:00',
    });

    expect(client).toEqual({
      id: 'c-1',
      tenant_id: 't-1',
      name: 'Globex',
      slug: 'globex',
      is_active: false,
      created_at: '2026-01-01T00:00:00+00:00',
    });
  });

  it('comble les champs absents sans produire undefined', () => {
    const client = normalizeClient({});

    expect(client.id).toBe('');
    expect(client.tenant_id).toBe('');
    expect(client.name).toBe('');
    expect(client.slug).toBe('');
    expect(client.created_at).toBeNull();
  });

  it('considere un client actif par defaut', () => {
    expect(normalizeClient({}).is_active).toBe(true);
  });
});
