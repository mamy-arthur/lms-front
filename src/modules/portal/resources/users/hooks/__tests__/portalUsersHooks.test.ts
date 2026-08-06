/**
 * Tests unitaires — hooks portal users
 *
 * Couvre :
 *  - useClientUsersQuery : query key, normalisation, params
 *  - useDeleteClientUser : mutationFn + invalidation du cache
 *  - useToggleClientUserActive : mutationFn ({ id, is_active }) + invalidation
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiDelete } from '@/shared/lib/apiClient';
import { Role } from '@/shared/constants/roles';

import { useClientUsersQuery, TENANT_USERS_QUERY_KEY } from '../useClientUsersQuery';
import { useDeleteClientUser } from '../useDeleteClientUser';
import { useToggleClientUserActive } from '../useToggleClientUserActive';

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseQueryClient = jest.mocked(useQueryClient);
const mockApiGet = jest.mocked(apiGet);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const mockInvalidateQueries = jest.fn();

const RAW_CLIENT_USER = {
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

// ─── useClientUsersQuery ──────────────────────────────────────────────────────

describe('useClientUsersQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>);
  });

  it('utilise le bon query key de base', () => {
    renderHook(() => useClientUsersQuery());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...TENANT_USERS_QUERY_KEY, undefined],
      }),
    );
  });

  it('intègre les params dans le query key', () => {
    const params = { q: 'claire', is_active: false };
    renderHook(() => useClientUsersQuery(params));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...TENANT_USERS_QUERY_KEY, params],
      }),
    );
  });

  it('la queryFn normalise les données et retourne { data, total }', async () => {
    mockApiGet.mockResolvedValue({ data: [RAW_CLIENT_USER], total: 1 });
    renderHook(() => useClientUsersQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'cu-001',
      first_name: 'Claire',
      last_name: 'Moreau',
      email: 'claire@example.com',
      is_active: true,
    });
    expect(result.total).toBe(1);
  });

  it('la queryFn retourne un tableau vide sans erreur', async () => {
    mockApiGet.mockResolvedValue({ data: [], total: 0 });
    renderHook(() => useClientUsersQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('active placeholderData', () => {
    renderHook(() => useClientUsersQuery());
    const options = mockUseQuery.mock.calls[0][0] as { placeholderData?: unknown };
    expect(typeof options.placeholderData).toBe('function');
  });

  it('la queryFn propage une erreur API', async () => {
    mockApiGet.mockRejectedValue(Object.assign(new Error('Server Error'), { status: 500 }));
    renderHook(() => useClientUsersQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<unknown>;
    };

    await expect(queryFn({})).rejects.toMatchObject({ status: 500 });
  });
});

// ─── useDeleteClientUser ──────────────────────────────────────────────────────

describe('useDeleteClientUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it("la mutationFn appelle clientUsersApi.remove avec l'id", async () => {
    mockApiDelete.mockResolvedValue(undefined);
    renderHook(() => useDeleteClientUser());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (id: string) => Promise<unknown>;
    };

    await mutationFn('cu-001');
    expect(mockApiDelete).toHaveBeenCalledWith('users/cu-001');
  });

  it('invalide le query key après succès', () => {
    renderHook(() => useDeleteClientUser());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: TENANT_USERS_QUERY_KEY }),
    );
  });

  it('définit un handler onError', () => {
    renderHook(() => useDeleteClientUser());
    const { onError } = mockUseMutation.mock.calls[0][0] as { onError?: unknown };
    expect(typeof onError).toBe('function');
  });
});

// ─── useToggleClientUserActive ────────────────────────────────────────────────

describe('useToggleClientUserActive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('la mutationFn appelle clientUsersApi.update avec { is_active }', async () => {
    mockApiPatch.mockResolvedValue({ data: RAW_CLIENT_USER });
    renderHook(() => useToggleClientUserActive());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (args: { id: string; is_active: boolean }) => Promise<unknown>;
    };

    await mutationFn({ id: 'cu-001', is_active: false });
    expect(mockApiPatch).toHaveBeenCalledWith('users/cu-001', { is_active: false });
  });

  it('invalide le query key après succès', () => {
    renderHook(() => useToggleClientUserActive());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: TENANT_USERS_QUERY_KEY }),
    );
  });

  it('définit un handler onError', () => {
    renderHook(() => useToggleClientUserActive());
    const { onError } = mockUseMutation.mock.calls[0][0] as { onError?: unknown };
    expect(typeof onError).toBe('function');
  });
});
