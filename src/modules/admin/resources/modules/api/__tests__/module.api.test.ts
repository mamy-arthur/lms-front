/**
 * Tests unitaires — adminModulesApi
 *
 * On vérifie :
 *  - les bons endpoints sont appelés pour chaque méthode
 *  - les payloads sont transmis correctement
 *  - les réponses sont retournées telles quelles
 *  - les erreurs API sont propagées
 */

// @jest-environment node

// ─── Mock apiClient ───────────────────────────────────────────────────────────
jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
  apiUpload: jest.fn(),
}));

import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib/apiClient';
import { adminModulesApi } from '../index';
import type { CompetencyApiResponse, CreateModulePayload } from '../../types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPut = jest.mocked(apiPut);
const mockApiDelete = jest.mocked(apiDelete);

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const MOCK_COMPETENCY: CompetencyApiResponse = {
  id: 'mod-uuid-001',
  shortname: 'Développement Web',
  idnumber: 'DW-001',
  description: '<p>Module de dev web</p>',
  tenant_id: 'tenant-1',
  course_ids: ['c-001', 'c-002'],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const CREATE_PAYLOAD: CreateModulePayload = {
  shortname: 'Développement Web',
  idnumber: 'DW-001',
  description: '<p>Module de dev web</p>',
  category_id: 'cat-1',
  course_ids: ['c-001', 'c-002'],
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('adminModulesApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list(params)', () => {
    it('appelle GET platform/competencies avec les paramètres de pagination', async () => {
      mockApiGet.mockResolvedValue({
        data: [MOCK_COMPETENCY],
        meta: { total: 1, current_page: 1, per_page: 25 },
      });

      await adminModulesApi.list({ page: 1, per_page: 25 });

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith(expect.stringMatching(/^platform\/competencies\?/));
    });

    it('inclut le paramètre de recherche quand q est fourni', async () => {
      mockApiGet.mockResolvedValue({ data: [], meta: { total: 0, current_page: 1, per_page: 25 } });

      await adminModulesApi.list({ q: 'web' });

      expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining('q=web'));
    });

    it('inclut le tri quand sort_by est fourni', async () => {
      mockApiGet.mockResolvedValue({ data: [], meta: { total: 0, current_page: 1, per_page: 25 } });

      await adminModulesApi.list({ sort_by: 'shortname', sort_order: 'asc' });

      const url = mockApiGet.mock.calls[0][0] as string;
      expect(url).toContain('sort_by=shortname');
      expect(url).toContain('sort_order=asc');
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      await expect(adminModulesApi.list({})).rejects.toThrow('Network error');
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe('getById(id)', () => {
    it('appelle GET platform/competencies/{id}', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_COMPETENCY });

      await adminModulesApi.getById('mod-uuid-001');

      expect(mockApiGet).toHaveBeenCalledWith('platform/competencies/mod-uuid-001');
    });

    it('retourne la compétence correspondante', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_COMPETENCY });

      const result = await adminModulesApi.getById('mod-uuid-001');

      expect(result.data.id).toBe('mod-uuid-001');
      expect(result.data.shortname).toBe('Développement Web');
    });

    it('propage les erreurs 404', async () => {
      mockApiGet.mockRejectedValue(new Error('Not Found'));

      await expect(adminModulesApi.getById('unknown')).rejects.toThrow('Not Found');
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create(payload)', () => {
    it('appelle POST platform/competencies', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_COMPETENCY });

      await adminModulesApi.create(CREATE_PAYLOAD);

      expect(mockApiPost).toHaveBeenCalledTimes(1);
      expect(mockApiPost).toHaveBeenCalledWith('platform/competencies', CREATE_PAYLOAD);
    });

    it('transmet le payload intégralement', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_COMPETENCY });

      await adminModulesApi.create(CREATE_PAYLOAD);

      const [, sentPayload] = mockApiPost.mock.calls[0];
      expect(sentPayload).toStrictEqual(CREATE_PAYLOAD);
    });

    it('retourne le module créé', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_COMPETENCY });

      const result = await adminModulesApi.create(CREATE_PAYLOAD);

      expect(result.data.shortname).toBe(CREATE_PAYLOAD.shortname);
    });

    it('propage les erreurs de validation (422)', async () => {
      mockApiPost.mockRejectedValue(new Error('Unprocessable Entity'));

      await expect(adminModulesApi.create(CREATE_PAYLOAD)).rejects.toThrow('Unprocessable Entity');
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update(id, payload)', () => {
    it('appelle PUT platform/competencies/{id}', async () => {
      mockApiPut.mockResolvedValue({ data: MOCK_COMPETENCY });

      await adminModulesApi.update('mod-uuid-001', {
        shortname: 'Nouveau nom',
        idnumber: 'DW-001',
        category_id: 'cat-1',
        course_ids: [],
      });

      expect(mockApiPut).toHaveBeenCalledWith(
        'platform/competencies/mod-uuid-001',
        expect.objectContaining({ shortname: 'Nouveau nom' }),
      );
    });

    it("construit l'URL avec l'id fourni", async () => {
      mockApiPut.mockResolvedValue({ data: MOCK_COMPETENCY });

      await adminModulesApi.update('abc-999', {
        shortname: 'Test',
        idnumber: 'T-001',
        category_id: 'cat-1',
        course_ids: [],
      });

      expect(mockApiPut).toHaveBeenCalledWith('platform/competencies/abc-999', expect.any(Object));
    });

    it('retourne le module mis à jour', async () => {
      const updated = { ...MOCK_COMPETENCY, shortname: 'Nouveau nom' };
      mockApiPut.mockResolvedValue({ data: updated });

      const result = await adminModulesApi.update('mod-uuid-001', {
        shortname: 'Nouveau nom',
        idnumber: 'DW-001',
        category_id: 'cat-1',
        course_ids: [],
      });

      expect(result.data.shortname).toBe('Nouveau nom');
    });

    it('propage les erreurs réseau', async () => {
      mockApiPut.mockRejectedValue(new Error('Network error'));

      await expect(
        adminModulesApi.update('mod-uuid-001', {
          shortname: 'x',
          idnumber: 'y',
          category_id: 'cat-1',
          course_ids: [],
        }),
      ).rejects.toThrow('Network error');
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove(id)', () => {
    it('appelle DELETE platform/competencies/{id}', async () => {
      mockApiDelete.mockResolvedValue(undefined);

      await adminModulesApi.remove('mod-uuid-001');

      expect(mockApiDelete).toHaveBeenCalledWith('platform/competencies/mod-uuid-001');
    });

    it('propage les erreurs 403', async () => {
      mockApiDelete.mockRejectedValue(new Error('Forbidden'));

      await expect(adminModulesApi.remove('mod-uuid-001')).rejects.toThrow('Forbidden');
    });
  });

  // ── duplicate ─────────────────────────────────────────────────────────────

  describe('duplicate(id, shortname?)', () => {
    it('appelle POST platform/competencies/{id}/duplicate sans shortname', async () => {
      mockApiPost.mockResolvedValue({
        data: { ...MOCK_COMPETENCY, shortname: 'Développement Web-COPY' },
      });

      await adminModulesApi.duplicate('mod-uuid-001');

      expect(mockApiPost).toHaveBeenCalledWith('platform/competencies/mod-uuid-001/duplicate', {});
    });

    it('envoie shortname quand il est fourni', async () => {
      mockApiPost.mockResolvedValue({ data: { ...MOCK_COMPETENCY, shortname: 'Dev Web BIS' } });

      await adminModulesApi.duplicate('mod-uuid-001', 'Dev Web BIS');

      expect(mockApiPost).toHaveBeenCalledWith('platform/competencies/mod-uuid-001/duplicate', {
        shortname: 'Dev Web BIS',
      });
    });

    it('retourne la compétence dupliquée', async () => {
      const copy = { ...MOCK_COMPETENCY, id: 'new-uuid', shortname: 'Développement Web-COPY' };
      mockApiPost.mockResolvedValue({ data: copy });

      const result = await adminModulesApi.duplicate('mod-uuid-001');

      expect(result.data.id).toBe('new-uuid');
    });
  });

  // ── availableCourses ──────────────────────────────────────────────────────

  describe('availableCourses(competencyId?)', () => {
    it('appelle GET platform/competencies/available-courses sans competencyId', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      await adminModulesApi.availableCourses();

      expect(mockApiGet).toHaveBeenCalledWith('platform/competencies/available-courses');
    });

    it('ajoute le paramètre competency_id en mode édition', async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      await adminModulesApi.availableCourses('mod-uuid-001');

      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/competencies/available-courses?competency_id=mod-uuid-001',
      );
    });

    it('normalise la réponse en AvailableCourse[]', async () => {
      mockApiGet.mockResolvedValue({
        data: [
          { id: 'c-1', full_name: 'Cours A', category_id: 'cat-1', category_name: 'Dev' },
          { id: 'c-2', full_name: 'Cours B', category_id: null, category_name: null },
        ],
      });

      const result = await adminModulesApi.availableCourses();

      expect(result).toEqual([
        { id: 'c-1', fullName: 'Cours A', categoryId: 'cat-1', categoryName: 'Dev' },
        { id: 'c-2', fullName: 'Cours B', categoryId: '', categoryName: '' },
      ]);
    });

    it("retourne un tableau vide quand il n'y a aucun cours", async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      const result = await adminModulesApi.availableCourses();

      expect(result).toHaveLength(0);
    });
  });
});
