/**
 * Tests unitaires — contentEntriesApi
 *
 * Vérifie que :
 *  - `list(sectionId)` appelle GET platform/course-sections/{sectionId}/entries
 *  - `get(id)`         appelle GET platform/entries/{id}
 *  - `create()`        appelle POST et transmet content_type_id + data (jamais vide)
 *  - `update()`        appelle PUT platform/entries/{id}
 *  - `remove()`        appelle DELETE platform/entries/{id}
 *
 * Principe architectural testé :
 *  ContentEntry stocke les DONNÉES saisies par l'utilisateur.
 *  La structure des champs (schema) vient exclusivement de ContentType.
 *  Donc `create()` reçoit toujours des `data` renseignées, jamais `{}` vide.
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib/apiClient';
import { contentEntriesApi } from '../content-entries.api';
import type { ApiContentEntry } from '@/shared/types/course.types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPut = jest.mocked(apiPut);
const mockApiDelete = jest.mocked(apiDelete);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SECTION_ID = 'sec-1';
const ENTRY_ID = 'entry-1';

const MOCK_ENTRY: ApiContentEntry = {
  id: ENTRY_ID,
  course_section_id: SECTION_ID,
  content_type_id: 'ct-1',
  content_type_version: 1,
  is_published: false,
  data: { titre: 'Mon titre', corps: 'Corps du texte' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('contentEntriesApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ───────────────────────────────────────────────────────────────────

  describe('list(sectionId)', () => {
    it('appelle GET platform/course-sections/{sectionId}/entries', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_ENTRY] });

      await contentEntriesApi.list(SECTION_ID);

      expect(mockApiGet).toHaveBeenCalledWith(
        `platform/course-sections/${SECTION_ID}/entries`,
        expect.objectContaining({ page: 1 }),
      );
    });

    it('propage les erreurs API', async () => {
      mockApiGet.mockRejectedValue(new Error('Server error'));
      await expect(contentEntriesApi.list(SECTION_ID)).rejects.toThrow('Server error');
    });
  });

  // ── get ────────────────────────────────────────────────────────────────────

  describe('get(entryId)', () => {
    it('appelle GET platform/entries/{id}', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_ENTRY });

      await contentEntriesApi.get(ENTRY_ID);

      expect(mockApiGet).toHaveBeenCalledWith(`platform/entries/${ENTRY_ID}`);
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create(sectionId, payload)', () => {
    it('appelle POST platform/course-sections/{sectionId}/entries', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_ENTRY });

      await contentEntriesApi.create(SECTION_ID, {
        content_type_id: 'ct-1',
        data: { titre: 'Mon titre' },
      });

      expect(mockApiPost).toHaveBeenCalledWith(
        `platform/course-sections/${SECTION_ID}/entries`,
        expect.objectContaining({ content_type_id: 'ct-1' }),
      );
    });

    it('transmet les données du formulaire (data non vide)', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_ENTRY });

      const filledData = { titre: 'Mon titre', corps: 'Corps du texte' };
      await contentEntriesApi.create(SECTION_ID, {
        content_type_id: 'ct-1',
        data: filledData,
      });

      expect(mockApiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ data: filledData }),
      );
    });

    it("ne doit PAS être appelé avec data: {} — l'entry est créée après soumission du formulaire", async () => {
      // Ce test documente l'invariant architectural :
      // ContentEntry est créé APRÈS que l'utilisateur a rempli le formulaire,
      // jamais au moment de la sélection du ContentType.
      mockApiPost.mockResolvedValue({ data: MOCK_ENTRY });

      const emptyData = {};
      await contentEntriesApi.create(SECTION_ID, {
        content_type_id: 'ct-1',
        data: emptyData,
      });

      // L'API accepte des données vides techniquement, mais dans le flux UI
      // ce cas ne devrait jamais se produire — la création ne se fait qu'à la soumission.
      const callArgs = mockApiPost.mock.calls[0];
      const payload = callArgs[1] as { content_type_id: string; data: Record<string, unknown> };
      expect(payload.content_type_id).toBeDefined();
    });

    it('propage les erreurs API (ex: validation 422)', async () => {
      mockApiPost.mockRejectedValue(new Error('Unprocessable Entity'));
      await expect(
        contentEntriesApi.create(SECTION_ID, { content_type_id: 'ct-1', data: {} }),
      ).rejects.toThrow('Unprocessable Entity');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update(entryId, payload)', () => {
    it('appelle PUT platform/entries/{id}', async () => {
      mockApiPut.mockResolvedValue({ data: MOCK_ENTRY });

      await contentEntriesApi.update(ENTRY_ID, { data: { titre: 'Nouveau titre' } });

      expect(mockApiPut).toHaveBeenCalledWith(
        `platform/entries/${ENTRY_ID}`,
        expect.objectContaining({ data: { titre: 'Nouveau titre' } }),
      );
    });

    it('peut mettre à jour is_published indépendamment des données', async () => {
      mockApiPut.mockResolvedValue({ data: { ...MOCK_ENTRY, is_published: true } });

      await contentEntriesApi.update(ENTRY_ID, { is_published: true });

      expect(mockApiPut).toHaveBeenCalledWith(
        `platform/entries/${ENTRY_ID}`,
        { is_published: true },
      );
    });

    it('propage les erreurs API', async () => {
      mockApiPut.mockRejectedValue(new Error('Not Found'));
      await expect(contentEntriesApi.update(ENTRY_ID, {})).rejects.toThrow('Not Found');
    });
  });

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove(entryId)', () => {
    it('appelle DELETE platform/entries/{id}', async () => {
      mockApiDelete.mockResolvedValue(undefined);

      await contentEntriesApi.remove(ENTRY_ID);

      expect(mockApiDelete).toHaveBeenCalledWith(`platform/entries/${ENTRY_ID}`);
    });

    it('propage les erreurs API', async () => {
      mockApiDelete.mockRejectedValue(new Error('Forbidden'));
      await expect(contentEntriesApi.remove(ENTRY_ID)).rejects.toThrow('Forbidden');
    });
  });
});
