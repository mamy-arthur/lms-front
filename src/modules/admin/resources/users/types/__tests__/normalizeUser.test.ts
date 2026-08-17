/**
 * Tests unitaires — normalizeUser()
 *
 * Vérifie le mapping raw backend → User.
 * Cas couverts :
 *  - champs canoniques snake_case
 *  - full_name calculé depuis first_name + last_name si absent
 *  - profile_photo null si absent
 *  - updated_at null si absent
 *  - champs manquants → valeurs par défaut
 */

import { normalizeUser } from '../index';
import type { User } from '../index';
import { Role } from '@/shared/constants/roles';

const RAW_FULL = {
  id: 'u-001',
  tenant_id: 'tenant-1',
  editor_id: 'editor-1',
  first_name: 'Alice',
  last_name: 'Dupont',
  full_name: 'Alice Dupont',
  email: 'alice@example.com',
  role: Role.TRAINEE,
  is_active: true,
  profile_photo: { id: 'ph-1', url: 'https://cdn.example.com/photo.jpg', mime_type: 'image/jpeg' },
  address: '12 rue de la Paix',
  zip_code: '75001',
  city: 'Paris',
  country: 'FR',
  timezone: 'Europe/Paris',
  preferred_language: 'fr',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
};

// ─── Champs canoniques ────────────────────────────────────────────────────────

describe('normalizeUser — champs canoniques', () => {
  it('mappe id', () => expect(normalizeUser(RAW_FULL).id).toBe('u-001'));
  it('mappe tenant_id', () => expect(normalizeUser(RAW_FULL).tenant_id).toBe('tenant-1'));
  it('mappe editor_id', () => expect(normalizeUser(RAW_FULL).editor_id).toBe('editor-1'));
  it('mappe first_name', () => expect(normalizeUser(RAW_FULL).first_name).toBe('Alice'));
  it('mappe last_name', () => expect(normalizeUser(RAW_FULL).last_name).toBe('Dupont'));
  it('mappe full_name', () => expect(normalizeUser(RAW_FULL).full_name).toBe('Alice Dupont'));
  it('mappe email', () => expect(normalizeUser(RAW_FULL).email).toBe('alice@example.com'));
  it('mappe role', () => expect(normalizeUser(RAW_FULL).role).toBe(Role.TRAINEE));
  it('mappe is_active (true)', () => expect(normalizeUser(RAW_FULL).is_active).toBe(true));
  it('mappe profile_photo', () =>
    expect(normalizeUser(RAW_FULL).profile_photo).toEqual({
      id: 'ph-1',
      url: 'https://cdn.example.com/photo.jpg',
      mime_type: 'image/jpeg',
    }));
  it('mappe address', () => expect(normalizeUser(RAW_FULL).address).toBe('12 rue de la Paix'));
  it('mappe zip_code', () => expect(normalizeUser(RAW_FULL).zip_code).toBe('75001'));
  it('mappe city', () => expect(normalizeUser(RAW_FULL).city).toBe('Paris'));
  it('mappe country', () => expect(normalizeUser(RAW_FULL).country).toBe('FR'));
  it('mappe timezone', () => expect(normalizeUser(RAW_FULL).timezone).toBe('Europe/Paris'));
  it('mappe preferred_language', () =>
    expect(normalizeUser(RAW_FULL).preferred_language).toBe('fr'));
  it('mappe created_at', () =>
    expect(normalizeUser(RAW_FULL).created_at).toBe('2025-01-01T00:00:00Z'));
  it('mappe updated_at', () =>
    expect(normalizeUser(RAW_FULL).updated_at).toBe('2025-06-01T00:00:00Z'));
});

// ─── Valeurs par défaut ────────────────────────────────────────────────────────

describe('normalizeUser — valeurs par défaut sur objet vide', () => {
  const empty = normalizeUser({});

  it('id vaut chaîne vide', () => expect(empty.id).toBe(''));
  it('first_name vaut chaîne vide', () => expect(empty.first_name).toBe(''));
  it('last_name vaut chaîne vide', () => expect(empty.last_name).toBe(''));
  it('email vaut chaîne vide', () => expect(empty.email).toBe(''));
  it('role vaut TRAINEE par défaut', () => expect(empty.role).toBe(Role.TRAINEE));
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

describe('normalizeUser — fallbacks', () => {
  it('full_name calculé depuis first_name + last_name si absent', () => {
    const user = normalizeUser({ first_name: 'Bob', last_name: 'Martin' });
    expect(user.full_name).toBe('Bob Martin');
  });

  it("full_name ne contient pas d'espace superflu si last_name vide", () => {
    const user = normalizeUser({ first_name: 'Bob', last_name: '' });
    expect(user.full_name).toBe('Bob');
  });

  it('is_active vaut true si absent', () => {
    expect(normalizeUser({}).is_active).toBe(true);
  });
});
