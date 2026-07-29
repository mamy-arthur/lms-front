/**
 * Tests unitaires — normalizeMailTemplate()
 *
 * Fonction pure : vérifie le mapping raw backend → MailTemplate.
 * Cas couverts :
 *  - champs canoniques (is_active, tenant_id, created_at, updated_at)
 *  - variantes acceptées (isActive, status, tenantId, createdAt, updatedAt)
 *  - champs manquants → valeurs par défaut (chaîne vide / false)
 */

import { normalizeMailTemplate } from '../types';

describe('normalizeMailTemplate', () => {
  describe('mapping des champs canoniques (snake_case backend)', () => {
    const raw = {
      id: 'tpl-001',
      reference: 'REF-001',
      name: "Confirmation d'inscription",
      subject: 'Bienvenue sur la plateforme',
      is_active: true,
      tenant_id: 'tenant-abc',
      body: '<p>Bonjour</p>',
      created_at: '2025-01-10T09:00:00Z',
      updated_at: '2025-05-15T14:00:00Z',
    };

    it('mappe id', () => expect(normalizeMailTemplate(raw).id).toBe('tpl-001'));
    it('mappe reference', () => expect(normalizeMailTemplate(raw).reference).toBe('REF-001'));
    it('mappe name', () =>
      expect(normalizeMailTemplate(raw).name).toBe("Confirmation d'inscription"));
    it('mappe subject', () =>
      expect(normalizeMailTemplate(raw).subject).toBe('Bienvenue sur la plateforme'));
    it('mappe is_active → isActive (true)', () =>
      expect(normalizeMailTemplate(raw).isActive).toBe(true));
    it('mappe tenant_id → tenantId', () =>
      expect(normalizeMailTemplate(raw).tenantId).toBe('tenant-abc'));
    it('mappe body', () => expect(normalizeMailTemplate(raw).body).toBe('<p>Bonjour</p>'));
    it('mappe created_at → createdAt', () =>
      expect(normalizeMailTemplate(raw).createdAt).toBe('2025-01-10T09:00:00Z'));
    it('mappe updated_at → updatedAt', () =>
      expect(normalizeMailTemplate(raw).updatedAt).toBe('2025-05-15T14:00:00Z'));
  });

  describe('variantes de noms de champs', () => {
    it('accepte isActive (camelCase) pour le statut', () => {
      const result = normalizeMailTemplate({ isActive: true });
      expect(result.isActive).toBe(true);
    });

    it('accepte status pour le statut', () => {
      const result = normalizeMailTemplate({ status: true });
      expect(result.isActive).toBe(true);
    });

    it('accepte tenantId (camelCase) pour tenantId', () => {
      const result = normalizeMailTemplate({ tenantId: 'tenant-xyz' });
      expect(result.tenantId).toBe('tenant-xyz');
    });

    it('accepte createdAt (camelCase) pour createdAt', () => {
      const result = normalizeMailTemplate({ createdAt: '2025-01-01T00:00:00Z' });
      expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
    });

    it('accepte updatedAt (camelCase) pour updatedAt', () => {
      const result = normalizeMailTemplate({ updatedAt: '2025-06-01T00:00:00Z' });
      expect(result.updatedAt).toBe('2025-06-01T00:00:00Z');
    });
  });

  describe('valeurs par défaut sur champs manquants', () => {
    it('retourne une chaîne vide pour id manquant', () => {
      expect(normalizeMailTemplate({}).id).toBe('');
    });

    it('retourne false pour isActive manquant', () => {
      expect(normalizeMailTemplate({}).isActive).toBe(false);
    });

    it('retourne une chaîne vide pour tous les champs string manquants', () => {
      const result = normalizeMailTemplate({});
      expect(result.reference).toBe('');
      expect(result.name).toBe('');
      expect(result.subject).toBe('');
      expect(result.body).toBe('');
      expect(result.tenantId).toBe('');
      expect(result.createdAt).toBe('');
      expect(result.updatedAt).toBe('');
    });

    it('is_active false → isActive false', () => {
      expect(normalizeMailTemplate({ is_active: false }).isActive).toBe(false);
    });
  });

  describe('valeurs null (réponse API incomplète)', () => {
    it('convertit id null en chaîne vide (null ?? fallback → "")', () => {
      expect(normalizeMailTemplate({ id: null }).id).toBe('');
    });

    it('accepte _id comme fallback de id', () => {
      expect(normalizeMailTemplate({ _id: 'mongo-id-001' }).id).toBe('mongo-id-001');
    });

    it('id prend la priorité sur _id', () => {
      expect(normalizeMailTemplate({ id: 'uuid-1', _id: 'mongo-1' }).id).toBe('uuid-1');
    });

    it('is_active null → isActive false (Boolean(null) = false)', () => {
      expect(normalizeMailTemplate({ is_active: null }).isActive).toBe(false);
    });
  });
});
