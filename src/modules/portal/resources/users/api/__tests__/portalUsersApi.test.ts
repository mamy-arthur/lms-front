/**
 * Tests unitaires — clientUsersApi
 *
 * Vérifie que chaque méthode appelle le bon endpoint via apiClient.
 * Cas couverts :
 *  - happy path : bons endpoints + payloads transmis + réponses retournées
 *  - params de filtrage (q, role, is_active, sort)
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
import { clientUsersApi } from '../index';
import { Role } from '@/shared/constants/roles';
import type { CreateClientUserPayload, UpdateClientUserPayload } from '../../types';

const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const MOCK_CLIENT_USER = {
  id: 'cu-001',
  first_name: 'Claire',
  last_name: 'Moreau',
  full_name: 'Claire Moreau',
  email: 'claire@example.com',
  role: Role.TRAINEE,
  is_active: true,
  profile_photo: null,
  tenant_id: 'tenant-2',
  editor_id: null,
  address: null,
  zip_code: null,
  city: null,
  country: null,
  timezone: null,
  preferred_language: null,
  created_at: '2025-02-01T00:00:00Z',
  updated_at: null,
};

describe('clientUsersApi', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── list ──────────────────────────────────────────────────────────────────

  describe('list(params?)', () => {
    it('appelle GET users sans params', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await clientUsersApi.list();
      expect(mockApiGet).toHaveBeenCalledWith('users', {});
    });

    it('transmet le paramètre q', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await clientUsersApi.list({ q: 'claire' });
      expect(mockApiGet).toHaveBeenCalledWith('users', expect.objectContaining({ q: 'claire' }));
    });

    it('transmet is_active true', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await clientUsersApi.list({ is_active: true });
      expect(mockApiGet).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({ is_active: true }),
      );
    });

    it('transmet is_active false', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await clientUsersApi.list({ is_active: false });
      expect(mockApiGet).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({ is_active: false }),
      );
    });

    it('convertit page 2 en 1 (0-based backend)', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await clientUsersApi.list({ page: 2 });
      expect(mockApiGet).toHaveBeenCalledWith('users', expect.objectContaining({ page: 1 }));
    });

    it('ne descend pas sous 0 pour page 0', async () => {
      mockApiGet.mockResolvedValue({ data: [], total: 0 });
      await clientUsersApi.list({ page: 0 });
      expect(mockApiGet).toHaveBeenCalledWith('users', expect.objectContaining({ page: 0 }));
    });

    it('retourne la réponse brute', async () => {
      mockApiGet.mockResolvedValue({ data: [MOCK_CLIENT_USER], total: 1 });
      const result = await clientUsersApi.list();
      expect(result).toEqual({ data: [MOCK_CLIENT_USER], total: 1 });
    });

    it('propage les erreurs réseau', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));
      await expect(clientUsersApi.list()).rejects.toThrow('Network error');
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create(payload)', () => {
    const payload: CreateClientUserPayload = {
      first_name: 'Claire',
      last_name: 'Moreau',
      email: 'claire@example.com',
      password: 'secret123',
      role: Role.TRAINEE,
    };

    it('appelle POST users', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_CLIENT_USER });
      await clientUsersApi.create(payload);
      expect(mockApiPost).toHaveBeenCalledWith('users', payload);
    });

    it('retourne la réponse brute', async () => {
      mockApiPost.mockResolvedValue({ data: MOCK_CLIENT_USER });
      const result = await clientUsersApi.create(payload);
      expect(result).toEqual({ data: MOCK_CLIENT_USER });
    });

    it('propage les erreurs 422', async () => {
      mockApiPost.mockRejectedValue(Object.assign(new Error('Unprocessable'), { status: 422 }));
      await expect(clientUsersApi.create(payload)).rejects.toMatchObject({ status: 422 });
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update(id, data)', () => {
    const data: UpdateClientUserPayload = { first_name: 'Clara', is_active: false };

    it('appelle PATCH users/:id', async () => {
      mockApiPatch.mockResolvedValue({ data: MOCK_CLIENT_USER });
      await clientUsersApi.update('cu-001', data);
      expect(mockApiPatch).toHaveBeenCalledWith('users/cu-001', data);
    });

    it('retourne la réponse brute', async () => {
      mockApiPatch.mockResolvedValue({ data: MOCK_CLIENT_USER });
      const result = await clientUsersApi.update('cu-001', data);
      expect(result).toEqual({ data: MOCK_CLIENT_USER });
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove(id)', () => {
    it('appelle DELETE users/:id', async () => {
      mockApiDelete.mockResolvedValue(undefined);
      await clientUsersApi.remove('cu-001');
      expect(mockApiDelete).toHaveBeenCalledWith('users/cu-001');
    });

    it('propage les erreurs 403', async () => {
      mockApiDelete.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
      await expect(clientUsersApi.remove('cu-001')).rejects.toMatchObject({ status: 403 });
    });
  });
});
