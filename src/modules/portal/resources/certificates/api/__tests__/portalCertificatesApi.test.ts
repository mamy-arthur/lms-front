/**
 * Tests unitaires — portalCertificatesApi
 *
 * Vérifie que chaque méthode appelle le bon endpoint via apiClient.
 * Cas couverts :
 *  - happy path : bons endpoints + payloads transmis + réponses retournées
 *  - cas nominaux : params de recherche, pagination
 *  - exceptions : erreurs 404, 403, 422, réseau
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
  apiUpload: jest.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib/apiClient';
import { portalCertificatesApi } from '../index';
import type {
  CreateCertificatePayload,
  UpdateCertificatePayload,
  PreviewCertificatePayload,
} from '../../types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const MOCK_CERT = {
  id: 'cert-001',
  reference: 'CERT-REF-001',
  name: 'Attestation de formation',
  is_active: true,
  is_default_template: false,
  tenant_id: 'tenant-1',
  body: '<p>Attestation</p>',
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-06-15T12:00:00Z',
};

describe('portalCertificatesApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list(params?)', () => {
    it('appelle GET certificates sans params', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await portalCertificatesApi.list();
      expect(mockApiGet).toHaveBeenCalledWith('certificates', undefined);
    });

    it('transmet les params de recherche', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_CERT], total: 1 });
      await portalCertificatesApi.list({ q: 'formation', page: 0 });
      expect(mockApiGet).toHaveBeenCalledWith('certificates', { q: 'formation', page: 0 });
    });

    it('retourne la réponse brute', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_CERT], total: 1 });
      const result = await portalCertificatesApi.list();
      expect(result).toEqual({ data: [MOCK_CERT], total: 1 });
    });

    it('retourne une liste vide sans erreur', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      const result = await portalCertificatesApi.list();
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));
      await expect(portalCertificatesApi.list()).rejects.toThrow('Network error');
    });

    it('propage une erreur 401 (non authentifié)', async () => {
      mockApiGet.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }));
      await expect(portalCertificatesApi.list()).rejects.toMatchObject({ status: 401 });
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe('getById(id)', () => {
    it('appelle GET certificates/{id}', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_CERT });
      await portalCertificatesApi.getById('cert-001');
      expect(mockApiGet).toHaveBeenCalledWith('certificates/cert-001');
    });

    it('retourne la réponse', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_CERT });
      const result = await portalCertificatesApi.getById('cert-001');
      expect(result).toEqual({ data: MOCK_CERT });
    });

    it('propage une erreur 404', async () => {
      mockApiGet.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      await expect(portalCertificatesApi.getById('cert-xxx')).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create(data)', () => {
    const payload: CreateCertificatePayload = {
      name: 'Nouvelle attestation',
      status: true,
      setasdefault: false,
      body: '<p>Corps</p>',
      tenant_id: 'tenant-1',
    };

    it('appelle POST certificates avec le payload', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_CERT });
      await portalCertificatesApi.create(payload);
      expect(mockApiPost).toHaveBeenCalledWith('certificates', payload);
    });

    it('retourne la réponse', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_CERT });
      const result = await portalCertificatesApi.create(payload);
      expect(result).toEqual({ data: MOCK_CERT });
    });

    it('propage une erreur 422 (validation)', async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Unprocessable'), { status: 422 }));
      await expect(portalCertificatesApi.create(payload)).rejects.toMatchObject({ status: 422 });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update(id, data)', () => {
    const patch: UpdateCertificatePayload = { name: 'Attestation modifiée', status: false };

    it('appelle PATCH certificates/{id} avec le payload', async () => {
      mockApiPatch.mockResolvedValue({ data: MOCK_CERT });
      await portalCertificatesApi.update('cert-001', patch);
      expect(mockApiPatch).toHaveBeenCalledWith('certificates/cert-001', patch);
    });

    it('retourne la réponse mise à jour', async () => {
      mockApiPatch.mockResolvedValue({ data: { ...MOCK_CERT, name: 'Attestation modifiée' } });
      const result = await portalCertificatesApi.update('cert-001', patch);
      expect((result as { data: typeof MOCK_CERT }).data.name).toBe('Attestation modifiée');
    });

    it('propage une erreur 403 (non autorisé)', async () => {
      mockApiPatch.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
      await expect(portalCertificatesApi.update('cert-001', patch)).rejects.toMatchObject({
        status: 403,
      });
    });

    it('propage une erreur 404 (introuvable)', async () => {
      mockApiPatch.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      await expect(portalCertificatesApi.update('cert-xxx', patch)).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove(id)', () => {
    it('appelle DELETE certificates/{id}', async () => {
      mockApiDelete.mockResolvedValue(undefined);
      await portalCertificatesApi.remove('cert-001');
      expect(mockApiDelete).toHaveBeenCalledWith('certificates/cert-001');
    });

    it('propage une erreur 404 si le certificat est introuvable', async () => {
      mockApiDelete.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      await expect(portalCertificatesApi.remove('cert-xxx')).rejects.toMatchObject({ status: 404 });
    });
  });

  // ── duplicate ─────────────────────────────────────────────────────────────

  describe('duplicate(id)', () => {
    it('appelle POST certificates/{id}/duplicate', async () => {
      mockApiPost.mockResolvedValue({ data: { ...MOCK_CERT, id: 'cert-002' } });
      await portalCertificatesApi.duplicate('cert-001');
      expect(mockApiPost).toHaveBeenCalledWith('certificates/cert-001/duplicate');
    });

    it('retourne le certificat dupliqué', async () => {
      const duplicated = { ...MOCK_CERT, id: 'cert-002', name: 'Attestation (copie)' };
      mockApiPost.mockResolvedValue({ data: duplicated });
      const result = await portalCertificatesApi.duplicate('cert-001');
      expect(result).toEqual({ data: duplicated });
    });

    it('propage une erreur réseau', async () => {
      mockApiPost.mockRejectedValue(new Error('Network error'));
      await expect(portalCertificatesApi.duplicate('cert-001')).rejects.toThrow('Network error');
    });
  });

  // ── preview ───────────────────────────────────────────────────────────────

  describe('preview(id, payload)', () => {
    const previewPayload: PreviewCertificatePayload = {
      resolve_variables: true,
      user_id: 'user-1',
      course_id: 'course-1',
    };

    it('appelle POST certificates/{id}/preview avec le payload', async () => {
      mockApiPost.mockResolvedValue({ data: { body: '<p>Preview</p>', resolved: true } });
      await portalCertificatesApi.preview('cert-001', previewPayload);
      expect(mockApiPost).toHaveBeenCalledWith('certificates/cert-001/preview', previewPayload);
    });

    it('retourne le body résolu', async () => {
      mockApiPost.mockResolvedValue({ data: { body: '<p>Alice Dupont</p>', resolved: true } });
      const result = await portalCertificatesApi.preview('cert-001', previewPayload);
      expect(result.data.body).toBe('<p>Alice Dupont</p>');
      expect(result.data.resolved).toBe(true);
    });

    it('fonctionne avec un payload vide (variables non résolues)', async () => {
      mockApiPost.mockResolvedValue({ data: { body: '<p>{{name}}</p>', resolved: false } });
      await portalCertificatesApi.preview('cert-001', {});
      expect(mockApiPost).toHaveBeenCalledWith('certificates/cert-001/preview', {});
    });

    it('propage une erreur 404', async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      await expect(portalCertificatesApi.preview('cert-xxx', {})).rejects.toMatchObject({
        status: 404,
      });
    });
  });
});
