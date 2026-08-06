/**
 * Tests unitaires — portalMailTemplatesApi
 *
 * Vérifie que chaque méthode appelle le bon endpoint via apiClient.
 * On mocke apiClient pour éviter les appels réseau réels.
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
import { portalMailTemplatesApi } from '../index';
import type { CreateMailTemplatePayload, UpdateMailTemplatePayload } from '../../types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const MOCK_TEMPLATE = {
  id: 'tpl-001',
  reference: 'REF-001',
  name: "Confirmation d'inscription",
  subject: 'Bienvenue',
  is_active: true,
  tenant_id: 'tenant-1',
  body: '<p>Bonjour</p>',
  created_at: '2025-01-10T09:00:00Z',
  updated_at: '2025-05-15T14:00:00Z',
};

describe('portalMailTemplatesApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list(params?)', () => {
    it('appelle GET template-mails sans params', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await portalMailTemplatesApi.list();
      expect(mockApiGet).toHaveBeenCalledWith('template-mails', undefined);
    });

    it('transmet les params de recherche', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_TEMPLATE], total: 1 });
      await portalMailTemplatesApi.list({ q: 'confirm', page: 0 });
      expect(mockApiGet).toHaveBeenCalledWith('template-mails', { q: 'confirm', page: 0 });
    });

    it('retourne la réponse brute', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_TEMPLATE], total: 1 });
      const result = await portalMailTemplatesApi.list();
      expect(result).toEqual({ data: [MOCK_TEMPLATE], total: 1 });
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));
      await expect(portalMailTemplatesApi.list()).rejects.toThrow('Network error');
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe('getById(id)', () => {
    it('appelle GET template-mails/{id}', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_TEMPLATE });
      await portalMailTemplatesApi.getById('tpl-001');
      expect(mockApiGet).toHaveBeenCalledWith('template-mails/tpl-001');
    });

    it('propage une erreur 404', async () => {
      mockApiGet.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      await expect(portalMailTemplatesApi.getById('tpl-xxx')).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create(data)', () => {
    const payload: CreateMailTemplatePayload = {
      name: 'Nouveau template',
      subject: 'Sujet test',
      body: '<p>Corps</p>',
      status: true,
    };

    it('appelle POST template-mails avec le payload', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_TEMPLATE });
      await portalMailTemplatesApi.create(payload);
      expect(mockApiPost).toHaveBeenCalledWith('template-mails', payload);
    });

    it('retourne la réponse', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_TEMPLATE });
      const result = await portalMailTemplatesApi.create(payload);
      expect(result).toEqual({ data: MOCK_TEMPLATE });
    });

    it('propage une erreur 422 (validation)', async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Unprocessable'), { status: 422 }));
      await expect(portalMailTemplatesApi.create(payload)).rejects.toMatchObject({ status: 422 });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update(id, data)', () => {
    const patch: UpdateMailTemplatePayload = { name: 'Nom modifié', status: false };

    it('appelle PATCH template-mails/{id} avec le payload', async () => {
      mockApiPatch.mockResolvedValue({ data: MOCK_TEMPLATE });
      await portalMailTemplatesApi.update('tpl-001', patch);
      expect(mockApiPatch).toHaveBeenCalledWith('template-mails/tpl-001', patch);
    });

    it('propage une erreur 403 (non autorisé)', async () => {
      mockApiPatch.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
      await expect(portalMailTemplatesApi.update('tpl-001', patch)).rejects.toMatchObject({
        status: 403,
      });
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove(id)', () => {
    it('appelle DELETE template-mails/{id}', async () => {
      mockApiDelete.mockResolvedValue(undefined);
      await portalMailTemplatesApi.remove('tpl-001');
      expect(mockApiDelete).toHaveBeenCalledWith('template-mails/tpl-001');
    });

    it('propage une erreur 404 si le template est introuvable', async () => {
      mockApiDelete.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      await expect(portalMailTemplatesApi.remove('tpl-xxx')).rejects.toMatchObject({ status: 404 });
    });
  });

  // ── duplicate ─────────────────────────────────────────────────────────────

  describe('duplicate(id)', () => {
    it('appelle POST template-mails/{id}/duplicate', async () => {
      mockApiPost.mockResolvedValue({ data: { ...MOCK_TEMPLATE, id: 'tpl-002' } });
      await portalMailTemplatesApi.duplicate('tpl-001');
      expect(mockApiPost).toHaveBeenCalledWith('template-mails/tpl-001/duplicate');
    });

    it('retourne le template dupliqué', async () => {
      const duplicated = { ...MOCK_TEMPLATE, id: 'tpl-002', name: 'Confirmation (copie)' };
      mockApiPost.mockResolvedValue({ data: duplicated });
      const result = await portalMailTemplatesApi.duplicate('tpl-001');
      expect(result).toEqual({ data: duplicated });
    });
  });
});
