/**
 * Tests unitaires — contentTypeApi
 *
 * On vérifie :
 *  - les bons endpoints sont appelés pour chaque méthode
 *  - les payloads sont transmis correctement
 *  - les réponses sont retournées telles quelles
 *  - les erreurs API sont propagées
 */

// ─── Mock apiClient (avant tout import du module testé) ───────────────────────

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
}));

import { apiGet, apiPost, apiPut } from '@/shared/lib/apiClient';
import { contentTypeApi } from '../index';
import type { ContentType, CreateContentTypePayload } from '../../types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPut = jest.mocked(apiPut);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_FIELD: ContentType['fields'][number] = {
  id: 'f-1',
  type: 'text',
  name: 'titre',
  label: 'Titre',
  required: true,
  is_archived: false,
};

const MOCK_CONTENT_TYPE: ContentType = {
  id: 'ct-1',
  module_type: 'page',
  title: 'Fiche pédagogique',
  description: 'Schéma de la page de cours',
  version: 1,
  status: 'active',
  fields: [MOCK_FIELD],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const CREATE_PAYLOAD: CreateContentTypePayload = {
  module_type: 'page',
  title: 'Fiche pédagogique',
  description: 'Schéma de la page de cours',
  fields: [
    {
      type: 'text',
      name: 'titre',
      label: 'Titre',
      required: true,
      is_archived: false,
    },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('contentTypeApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getAll ─────────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('appelle GET platform/content-types', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_CONTENT_TYPE] });

      await contentTypeApi.getAll();

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('platform/content-types');
    });

    it('retourne la liste des content types', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_CONTENT_TYPE] });

      const result = await contentTypeApi.getAll();

      expect(result).toEqual({ data: [MOCK_CONTENT_TYPE] });
    });

    it("retourne un tableau vide quand il n'y a aucun content type", async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      const result = await contentTypeApi.getAll();

      expect(result.data).toHaveLength(0);
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      await expect(contentTypeApi.getAll()).rejects.toThrow('Network error');
    });
  });

  // ── getOne ─────────────────────────────────────────────────────────────────

  describe('getOne(id)', () => {
    it('appelle GET platform/content-types/{id}', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.getOne('ct-1');

      expect(mockApiGet).toHaveBeenCalledWith('platform/content-types/ct-1');
    });

    it("construit l'URL avec l'id fourni", async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.getOne('abc-123-xyz');

      expect(mockApiGet).toHaveBeenCalledWith('platform/content-types/abc-123-xyz');
    });

    it('retourne le content type correspondant', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      const result = await contentTypeApi.getOne('ct-1');

      expect(result).toEqual({ data: MOCK_CONTENT_TYPE });
      expect(result.data.id).toBe('ct-1');
    });

    it('propage les erreurs 404', async () => {
      mockApiGet.mockRejectedValue(new Error('Not Found'));

      await expect(contentTypeApi.getOne('unknown-id')).rejects.toThrow('Not Found');
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create(payload)', () => {
    it('appelle POST platform/content-types', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.create(CREATE_PAYLOAD);

      expect(mockApiPost).toHaveBeenCalledTimes(1);
      expect(mockApiPost).toHaveBeenCalledWith('platform/content-types', CREATE_PAYLOAD);
    });

    it('transmet le payload intégralement', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.create(CREATE_PAYLOAD);

      const [, sentPayload] = mockApiPost.mock.calls[0];
      expect(sentPayload).toStrictEqual(CREATE_PAYLOAD);
    });

    it('retourne le content type créé', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      const result = await contentTypeApi.create(CREATE_PAYLOAD);

      expect(result).toEqual({ data: MOCK_CONTENT_TYPE });
      expect(result.data.title).toBe(CREATE_PAYLOAD.title);
    });

    it('crée sans description ni champs', async () => {
      const minimalPayload: CreateContentTypePayload = {
        module_type: 'file',
        title: 'Fichier simple',
        fields: [],
      };
      mockApiPost.mockResolvedValue({ data: { ...MOCK_CONTENT_TYPE, ...minimalPayload } });

      await contentTypeApi.create(minimalPayload);

      expect(mockApiPost).toHaveBeenCalledWith('platform/content-types', minimalPayload);
    });

    it('propage les erreurs de validation (422)', async () => {
      mockApiPost.mockRejectedValue(new Error('Unprocessable Entity'));

      await expect(contentTypeApi.create(CREATE_PAYLOAD)).rejects.toThrow('Unprocessable Entity');
    });

    it('propage les erreurs réseau', async () => {
      mockApiPost.mockRejectedValue(new Error('Network error'));

      await expect(contentTypeApi.create(CREATE_PAYLOAD)).rejects.toThrow('Network error');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update(id, payload)', () => {
    it('appelle PUT platform/content-types/{id}', async () => {
      mockApiPut.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.update('ct-1', { title: 'Nouveau titre' });

      expect(mockApiPut).toHaveBeenCalledTimes(1);
      expect(mockApiPut).toHaveBeenCalledWith('platform/content-types/ct-1', {
        title: 'Nouveau titre',
      });
    });

    it("construit l'URL avec l'id fourni", async () => {
      mockApiPut.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.update('ct-999', { title: 'Test' });

      expect(mockApiPut).toHaveBeenCalledWith('platform/content-types/ct-999', expect.any(Object));
    });

    it('accepte un payload partiel', async () => {
      mockApiPut.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.update('ct-1', { title: 'Seulement le titre' });

      const [, sentPayload] = mockApiPut.mock.calls[0];
      expect(sentPayload).toEqual({ title: 'Seulement le titre' });
    });

    it('retourne le content type mis à jour', async () => {
      const updated = { ...MOCK_CONTENT_TYPE, title: 'Nouveau titre' };
      mockApiPut.mockResolvedValue({ data: updated });

      const result = await contentTypeApi.update('ct-1', { title: 'Nouveau titre' });

      expect(result.data.title).toBe('Nouveau titre');
    });

    it('propage les erreurs 403', async () => {
      mockApiPut.mockRejectedValue(new Error('Forbidden'));

      await expect(contentTypeApi.update('ct-1', {})).rejects.toThrow('Forbidden');
    });

    it('propage les erreurs réseau', async () => {
      mockApiPut.mockRejectedValue(new Error('Network error'));

      await expect(contentTypeApi.update('ct-1', { title: 'Test' })).rejects.toThrow(
        'Network error',
      );
    });
  });
});
