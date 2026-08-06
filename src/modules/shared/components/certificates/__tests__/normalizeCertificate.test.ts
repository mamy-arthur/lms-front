/**
 * Tests unitaires — normalizeCertificate()
 *
 * Vérifie le mapping raw backend → Certificate.
 * Cas couverts :
 *  - champs canoniques snake_case (is_active, is_default_template, tenant_id…)
 *  - variantes camelCase (isActive, isDefaultTemplate, tenantId…)
 *  - variante setasdefault pour isDefaultTemplate
 *  - champs manquants → valeurs par défaut
 *  - valeurs null → fallback via ??
 *  - _id comme fallback de id
 */

import { normalizeCertificate } from '../types';

const RAW_FULL = {
  id: 'cert-001',
  reference: 'CERT-REF-001',
  name: 'Attestation de formation',
  is_active: true,
  is_default_template: true,
  tenant_id: 'tenant-abc',
  body: '<p>Attestation</p>',
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-06-15T12:00:00Z',
};

// ─── Mapping canonique ────────────────────────────────────────────────────────

describe('normalizeCertificate — champs canoniques (snake_case)', () => {
  it('mappe id', () => expect(normalizeCertificate(RAW_FULL).id).toBe('cert-001'));
  it('mappe reference', () =>
    expect(normalizeCertificate(RAW_FULL).reference).toBe('CERT-REF-001'));
  it('mappe name', () =>
    expect(normalizeCertificate(RAW_FULL).name).toBe('Attestation de formation'));
  it('mappe is_active → isActive (true)', () =>
    expect(normalizeCertificate(RAW_FULL).isActive).toBe(true));
  it('mappe is_default_template → isDefaultTemplate (true)', () =>
    expect(normalizeCertificate(RAW_FULL).isDefaultTemplate).toBe(true));
  it('mappe tenant_id → tenantId', () =>
    expect(normalizeCertificate(RAW_FULL).tenantId).toBe('tenant-abc'));
  it('mappe body', () => expect(normalizeCertificate(RAW_FULL).body).toBe('<p>Attestation</p>'));
  it('mappe created_at → createdAt', () =>
    expect(normalizeCertificate(RAW_FULL).createdAt).toBe('2025-03-01T08:00:00Z'));
  it('mappe updated_at → updatedAt', () =>
    expect(normalizeCertificate(RAW_FULL).updatedAt).toBe('2025-06-15T12:00:00Z'));
});

// ─── Variantes camelCase ──────────────────────────────────────────────────────

describe('normalizeCertificate — variantes de noms de champs', () => {
  it('accepte isActive (camelCase)', () =>
    expect(normalizeCertificate({ isActive: true }).isActive).toBe(true));

  it('accepte status pour isActive', () =>
    expect(normalizeCertificate({ status: true }).isActive).toBe(true));

  it('accepte isDefaultTemplate (camelCase)', () =>
    expect(normalizeCertificate({ isDefaultTemplate: true }).isDefaultTemplate).toBe(true));

  it('accepte setasdefault pour isDefaultTemplate', () =>
    expect(normalizeCertificate({ setasdefault: true }).isDefaultTemplate).toBe(true));

  it('accepte tenantId (camelCase)', () =>
    expect(normalizeCertificate({ tenantId: 'tenant-xyz' }).tenantId).toBe('tenant-xyz'));

  it('accepte createdAt (camelCase)', () =>
    expect(normalizeCertificate({ createdAt: '2025-01-01T00:00:00Z' }).createdAt).toBe(
      '2025-01-01T00:00:00Z',
    ));

  it('accepte updatedAt (camelCase)', () =>
    expect(normalizeCertificate({ updatedAt: '2025-06-01T00:00:00Z' }).updatedAt).toBe(
      '2025-06-01T00:00:00Z',
    ));
});

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

describe('normalizeCertificate — valeurs par défaut sur champs manquants', () => {
  it('retourne une chaîne vide pour tous les champs string manquants', () => {
    const result = normalizeCertificate({});
    expect(result.id).toBe('');
    expect(result.reference).toBe('');
    expect(result.name).toBe('');
    expect(result.tenantId).toBe('');
    expect(result.body).toBe('');
    expect(result.createdAt).toBe('');
    expect(result.updatedAt).toBe('');
  });

  it('retourne false pour isActive manquant', () =>
    expect(normalizeCertificate({}).isActive).toBe(false));

  it('retourne false pour isDefaultTemplate manquant', () =>
    expect(normalizeCertificate({}).isDefaultTemplate).toBe(false));

  it('is_active false → isActive false', () =>
    expect(normalizeCertificate({ is_active: false }).isActive).toBe(false));

  it('is_default_template false → isDefaultTemplate false', () =>
    expect(normalizeCertificate({ is_default_template: false }).isDefaultTemplate).toBe(false));
});

// ─── Valeurs null / fallbacks ─────────────────────────────────────────────────

describe('normalizeCertificate — valeurs null et fallbacks', () => {
  it('id null → "" (null ?? fallback vide)', () =>
    expect(normalizeCertificate({ id: null }).id).toBe(''));

  it('accepte _id comme fallback si id absent', () =>
    expect(normalizeCertificate({ _id: 'mongo-id-001' }).id).toBe('mongo-id-001'));

  it('id prend la priorité sur _id', () =>
    expect(normalizeCertificate({ id: 'uuid-1', _id: 'mongo-1' }).id).toBe('uuid-1'));

  it('is_active null → false (Boolean(null) = false)', () =>
    expect(normalizeCertificate({ is_active: null }).isActive).toBe(false));

  it('is_default_template null → false', () =>
    expect(normalizeCertificate({ is_default_template: null }).isDefaultTemplate).toBe(false));

  it('tenant_id null → "" (null ?? fallback vide)', () =>
    expect(normalizeCertificate({ tenant_id: null }).tenantId).toBe(''));
});
