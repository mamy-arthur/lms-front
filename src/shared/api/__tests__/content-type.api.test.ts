/**
 * Tests unitaires — contentTypeApi (shared)
 *
 * Vérifie que :
 *  - `list()` appelle GET platform/content-types (sans id)
 *  - `get(id)` appelle GET platform/content-types/{id}
 *  - les réponses sont retournées telles quelles
 *  - les erreurs sont propagées
 *
 * Principe de séparation des responsabilités testé :
 *  Le module ContentType est la SEULE source de vérité pour la définition
 *  des champs (schema) d'un type de contenu. ContentEntry ne doit jamais
 *  être utilisé pour obtenir la structure des champs.
 */

jest.mock('@/shared/lib/apiClient', () => ({ apiGet: jest.fn() }));

import { apiGet } from '@/shared/lib/apiClient';
import { contentTypeApi } from '../content-type.api';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

const mockApiGet = jest.mocked(apiGet);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_FIELD: ContentTypeResource['fields'][number] = {
  field_id: 'f-1',
  type: 'text',
  name: 'titre',
  label: 'Titre',
  required: true,
  is_archived: false,
  accept: [],
  max_size_mb: null,
  multiple: false,
};

const MOCK_CONTENT_TYPE: ContentTypeResource = {
  id: 'ct-1',
  module_type: 'page',
  title: 'Fiche pédagogique',
  description: 'Schéma de la page de cours',
  is_active: true,
  version: 1,
  fields: [MOCK_FIELD],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('contentTypeApi (shared)', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('appelle GET platform/content-types sans identifiant', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_CONTENT_TYPE] });

      await contentTypeApi.list();

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('platform/content-types');
    });

    it('retourne les données telles quelles (tableau avec fields)', async () => {
      const response = { data: [MOCK_CONTENT_TYPE] };
      mockApiGet.mockResolvedValue(response);

      const result = await contentTypeApi.list();

      expect(result).toEqual(response);
      // La liste contient bien les champs (fields) — source de vérité du schéma
      expect(result.data[0].fields).toHaveLength(1);
      expect(result.data[0].fields[0].name).toBe('titre');
    });

    it('propage les erreurs API', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      await expect(contentTypeApi.list()).rejects.toThrow('Network error');
    });
  });

  // ── get(id) ────────────────────────────────────────────────────────────────

  describe('get(id)', () => {
    it('appelle GET platform/content-types/{id}', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      await contentTypeApi.get('ct-1');

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('platform/content-types/ct-1');
    });

    it('retourne le ContentType avec ses champs (schema)', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_CONTENT_TYPE });

      const result = await contentTypeApi.get('ct-1');

      expect(result.data.id).toBe('ct-1');
      expect(result.data.fields).toHaveLength(1);
    });

    it('propage les erreurs API (ex: 404)', async () => {
      mockApiGet.mockRejectedValue(new Error('Not Found'));

      await expect(contentTypeApi.get('unknown')).rejects.toThrow('Not Found');
    });
  });
});
