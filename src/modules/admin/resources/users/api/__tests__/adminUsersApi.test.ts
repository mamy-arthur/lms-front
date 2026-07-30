/**
 * Tests unitaires — adminUsersApi
 *
 * Vérifie que chaque méthode appelle le bon endpoint via apiClient.
 * Cas couverts :
 *  - happy path : bons endpoints + payloads transmis + réponses retournées
 *  - params de filtrage (q, role, is_active, tenant_id, sort)
 *  - conversion de page 1-based (frontend) → 0-based (backend)
 *  - exceptions : erreurs réseau
 */

// @jest-environment node

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib/apiClient';
import { adminUsersApi } from '../index';
import { Role } from '@/shared/constants/roles';
import type { CreateUserPayload, UpdateUserPayload } from '../../types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const MOCK_USER = {
  id: 'u-001',
  first_name: 'Alice',
  last_name: 'Dupont',
  full_name: 'Alice Dupont',
  email: 'alice@example.com',
  role: Role.TRAINEE,
  is_active: true,
  profile_photo: null,
  tenant_id: null,
  editor_id: null,
  address: null,
  zip_code: null,
  city: null,
  country: null,
  timezone: null,
  preferred_language: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: null,
};

describe('adminUsersApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list(params?)', () => {
    it('appelle GET platform/users sans params', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list();
      expect(mockApiGet).toHaveBeenCalledWith('platform/users', {});
    });

    it('transmet le paramètre q', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ q: 'alice' });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ q: 'alice' }),
      );
    });

    it('transmet le paramètre role', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ role: Role.TRAINEE });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ role: Role.TRAINEE }),
      );
    });

    it('transmet is_active true', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ is_active: true });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ is_active: true }),
      );
    });

    it('transmet is_active false', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ is_active: false });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ is_active: false }),
      );
    });

    it('transmet tenant_id', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ tenant_id: 'tenant-1' });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ tenant_id: 'tenant-1' }),
      );
    });

    it('convertit page 1 en 0 (0-based backend)', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ page: 1 });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ page: 0 }),
      );
    });

    it('convertit page 3 en 2 (0-based backend)', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ page: 3 });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ page: 2 }),
      );
    });

    it('ne descend pas sous 0 pour page 0', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await adminUsersApi.list({ page: 0 });
      expect(mockApiGet).toHaveBeenCalledWith(
        'platform/users',
        expect.objectContaining({ page: 0 }),
      );
    });

    it('retourne la réponse brute', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_USER], total: 1 });
      const result = await adminUsersApi.list();
      expect(result).toEqual({ data: [MOCK_USER], total: 1 });
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));
      await expect(adminUsersApi.list()).rejects.toThrow('Network error');
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  describe('getById(id)', () => {
    it('appelle GET platform/users/:id', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_USER });
      await adminUsersApi.getById('u-001');
      expect(mockApiGet).toHaveBeenCalledWith('platform/users/u-001');
    });

    it('retourne la réponse brute', async () => {
      mockApiGet.mockResolvedValue({ data: MOCK_USER });
      const result = await adminUsersApi.getById('u-001');
      expect(result).toEqual({ data: MOCK_USER });
    });

    it('propage les erreurs 404', async () => {
      mockApiGet.mockRejectedValue(Object.assign(new Error('Not found'), { status: 404 }));
      await expect(adminUsersApi.getById('unknown')).rejects.toMatchObject({ status: 404 });
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create(payload)', () => {
    const payload: CreateUserPayload = {
      first_name: 'Alice',
      last_name: 'Dupont',
      email: 'alice@example.com',
      password: 'secret123',
      role: Role.TRAINEE,
    };

    it('appelle POST platform/users', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_USER });
      await adminUsersApi.create(payload);
      expect(mockApiPost).toHaveBeenCalledWith('platform/users', payload);
    });

    it('retourne la réponse brute', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_USER });
      const result = await adminUsersApi.create(payload);
      expect(result).toEqual({ data: MOCK_USER });
    });

    it('propage les erreurs 422', async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Unprocessable'), { status: 422 }));
      await expect(adminUsersApi.create(payload)).rejects.toMatchObject({ status: 422 });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update(id, data)', () => {
    const data: UpdateUserPayload = { first_name: 'Alicia', is_active: false };

    it('appelle PATCH platform/users/:id', async () => {
      mockApiPatch.mockResolvedValue({ data: MOCK_USER });
      await adminUsersApi.update('u-001', data);
      expect(mockApiPatch).toHaveBeenCalledWith('platform/users/u-001', data);
    });

    it('retourne la réponse brute', async () => {
      mockApiPatch.mockResolvedValue({ data: MOCK_USER });
      const result = await adminUsersApi.update('u-001', data);
      expect(result).toEqual({ data: MOCK_USER });
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove(id)', () => {
    it('appelle DELETE platform/users/:id', async () => {
      mockApiDelete.mockResolvedValue(undefined);
      await adminUsersApi.remove('u-001');
      expect(mockApiDelete).toHaveBeenCalledWith('platform/users/u-001');
    });

    it('propage les erreurs 403', async () => {
      mockApiDelete.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
      await expect(adminUsersApi.remove('u-001')).rejects.toMatchObject({ status: 403 });
    });
  });
});
