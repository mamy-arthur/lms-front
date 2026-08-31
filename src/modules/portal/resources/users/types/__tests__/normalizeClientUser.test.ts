/**
 * Tests unitaires — normalizeClientUser()
 *
 * Vérifie le mapping raw backend → ClientUser.
 * Cas couverts :
 *  - champs canoniques snake_case
 *  - full_name calculé depuis first_name + last_name si absent
 *  - profile_photo null si absent
 *  - updated_at null si absent
 *  - champs manquants → valeurs par défaut
 */

import { normalizeClientUser } from '../index';
import { Role } from '@/shared/constants/roles';

const RAW_FULL = {
  id: 'cu-001',
  tenant_id: 'tenant-2',
  editor_id: null,
  first_name: 'Claire',
  last_name: 'Moreau',
  full_name: 'Claire Moreau',
  email: 'claire@example.com',
  role: Role.TRAINEE,
  is_active: true,
  profile_photo: { id: 'ph-2', url: 'https://cdn.example.com/c.jpg', mime_type: 'image/png' },
  address: '5 avenue Foch',
  zip_code: '69001',
  city: 'Lyon',
  country: 'FR',
  timezone: 'Europe/Paris',
  preferred_language: 'fr',
  created_at: '2025-02-01T00:00:00Z',
  updated_at: '2025-07-01T00:00:00Z',
};

// ─── Champs canoniques ────────────────────────────────────────────────────────

describe('normalizeClientUser — champs canoniques', () => {
  it('mappe id', () => expect(normalizeClientUser(RAW_FULL).id).toBe('cu-001'));
  it('mappe tenant_id', () => expect(normalizeClientUser(RAW_FULL).tenant_id).toBe('tenant-2'));
  it('mappe editor_id null', () => expect(normalizeClientUser(RAW_FULL).editor_id).toBeNull());
  it('mappe first_name', () => expect(normalizeClientUser(RAW_FULL).first_name).toBe('Claire'));
  it('mappe last_name', () => expect(normalizeClientUser(RAW_FULL).last_name).toBe('Moreau'));
  it('mappe full_name', () =>
    expect(normalizeClientUser(RAW_FULL).full_name).toBe('Claire Moreau'));
  it('mappe email', () => expect(normalizeClientUser(RAW_FULL).email).toBe('claire@example.com'));
  it('mappe role', () => expect(normalizeClientUser(RAW_FULL).role).toBe(Role.TRAINEE));
  it('mappe is_active (true)', () => expect(normalizeClientUser(RAW_FULL).is_active).toBe(true));
  it('mappe profile_photo', () =>
    expect(normalizeClientUser(RAW_FULL).profile_photo).toEqual({
      id: 'ph-2',
      url: 'https://cdn.example.com/c.jpg',
      mime_type: 'image/png',
    }));
  it('mappe address', () => expect(normalizeClientUser(RAW_FULL).address).toBe('5 avenue Foch'));
  it('mappe zip_code', () => expect(normalizeClientUser(RAW_FULL).zip_code).toBe('69001'));
  it('mappe city', () => expect(normalizeClientUser(RAW_FULL).city).toBe('Lyon'));
  it('mappe country', () => expect(normalizeClientUser(RAW_FULL).country).toBe('FR'));
  it('mappe timezone', () => expect(normalizeClientUser(RAW_FULL).timezone).toBe('Europe/Paris'));
  it('mappe preferred_language', () =>
    expect(normalizeClientUser(RAW_FULL).preferred_language).toBe('fr'));
  it('mappe created_at', () =>
    expect(normalizeClientUser(RAW_FULL).created_at).toBe('2025-02-01T00:00:00Z'));
  it('mappe updated_at', () =>
    expect(normalizeClientUser(RAW_FULL).updated_at).toBe('2025-07-01T00:00:00Z'));
});

// ─── Valeurs par défaut ────────────────────────────────────────────────────────

describe('normalizeClientUser — valeurs par défaut sur objet vide', () => {
  const empty = normalizeClientUser({});

  it('id vaut chaîne vide', () => expect(empty.id).toBe(''));
  it('first_name vaut chaîne vide', () => expect(empty.first_name).toBe(''));
  it('last_name vaut chaîne vide', () => expect(empty.last_name).toBe(''));
  it('email vaut chaîne vide', () => expect(empty.email).toBe(''));
  it('is_active vaut true par défaut', () => expect(empty.is_active).toBe(true));
  it('profile_photo vaut null', () => expect(empty.profile_photo).toBeNull());
  it('tenant_id vaut null', () => expect(empty.tenant_id).toBeNull());
  it('editor_id vaut null', () => expect(empty.editor_id).toBeNull());
  it('address vaut null', () => expect(empty.address).toBeNull());
  it('zip_code vaut null', () => expect(empty.zip_code).toBeNull());
  it('city vaut null', () => expect(empty.city).toBeNull());
  it('country vaut null', () => expect(empty.country).toBeNull());
  it('timezone vaut null', () => expect(empty.timezone).toBeNull());
  it('preferred_language vaut null', () => expect(empty.preferred_language).toBeNull());
  it('updated_at vaut null', () => expect(empty.updated_at).toBeNull());
});

// ─── Fallbacks ────────────────────────────────────────────────────────────────

describe('normalizeClientUser — fallbacks', () => {
  it('full_name calculé depuis first_name + last_name si absent', () => {
    const user = normalizeClientUser({ first_name: 'Marc', last_name: 'Leroy' });
    expect(user.full_name).toBe('Marc Leroy');
  });

  it("full_name ne contient pas d'espace superflu si last_name vide", () => {
    const user = normalizeClientUser({ first_name: 'Marc', last_name: '' });
    expect(user.full_name).toBe('Marc');
  });

  it('is_active vaut true si absent', () => {
    expect(normalizeClientUser({}).is_active).toBe(true);
  });
});
