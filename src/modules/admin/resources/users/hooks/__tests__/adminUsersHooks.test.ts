/**
 * Tests unitaires — hooks admin users
 *
 * Couvre :
 *  - useUsersQuery : query key, normalisation, params
 *  - useDeleteUser : mutationFn + invalidation du cache
 *  - useToggleUserActive : mutationFn ({ id, is_active }) + invalidation
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

import { useUsersQuery, ADMIN_USERS_QUERY_KEY } from '../useUsersQuery';
import { useDeleteUser } from '../useDeleteUser';
import { useToggleUserActive } from '../useToggleUserActive';

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseQueryClient = jest.mocked(useQueryClient);
const mockApiGet = jest.mocked(apiGet);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const mockInvalidateQueries = jest.fn();

const RAW_USER = {
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

// ─── useUsersQuery ────────────────────────────────────────────────────────────

describe('useUsersQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>);
  });

  it('utilise le bon query key de base', () => {
    renderHook(() => useUsersQuery());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...ADMIN_USERS_QUERY_KEY, undefined],
      }),
    );
  });

  it('intègre les params dans le query key', () => {
    const params = { q: 'alice', is_active: true };
    renderHook(() => useUsersQuery(params));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...ADMIN_USERS_QUERY_KEY, params],
      }),
    );
  });

  it('la queryFn normalise les données et retourne { data, total }', async () => {
    mockApiGet.mockResolvedValue({ data: [RAW_USER], total: 1 });
    renderHook(() => useUsersQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'u-001',
      first_name: 'Alice',
      last_name: 'Dupont',
      email: 'alice@example.com',
      is_active: true,
    });
    expect(result.total).toBe(1);
  });

  it('la queryFn retourne un tableau vide sans erreur', async () => {
    mockApiGet.mockResolvedValue({ data: [], total: 0 });
    renderHook(() => useUsersQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('active placeholderData', () => {
    renderHook(() => useUsersQuery());
    const options = mockUseQuery.mock.calls[0][0] as { placeholderData?: unknown };
    expect(typeof options.placeholderData).toBe('function');
  });

  it('la queryFn propage une erreur API', async () => {
    mockApiGet.mockRejectedValue(Object.assign(new Error('Server Error'), { status: 500 }));
    renderHook(() => useUsersQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<unknown>;
    };

    await expect(queryFn({})).rejects.toMatchObject({ status: 500 });
  });
});

// ─── useDeleteUser ────────────────────────────────────────────────────────────

describe('useDeleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it("la mutationFn appelle adminUsersApi.remove avec l'id", async () => {
    mockApiDelete.mockResolvedValue(undefined);
    renderHook(() => useDeleteUser());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (id: string) => Promise<unknown>;
    };

    await mutationFn('u-001');
    expect(mockApiDelete).toHaveBeenCalledWith('platform/users/u-001');
  });

  it('invalide le query key après succès', () => {
    renderHook(() => useDeleteUser());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ADMIN_USERS_QUERY_KEY }),
    );
  });

  it('définit un handler onError', () => {
    renderHook(() => useDeleteUser());
    const { onError } = mockUseMutation.mock.calls[0][0] as { onError?: unknown };
    expect(typeof onError).toBe('function');
  });
});

// ─── useToggleUserActive ──────────────────────────────────────────────────────

describe('useToggleUserActive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('la mutationFn appelle adminUsersApi.update avec { is_active }', async () => {
    mockApiPatch.mockResolvedValue({ data: RAW_USER });
    renderHook(() => useToggleUserActive());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (args: { id: string; is_active: boolean }) => Promise<unknown>;
    };

    await mutationFn({ id: 'u-001', is_active: false });
    expect(mockApiPatch).toHaveBeenCalledWith('platform/users/u-001', { is_active: false });
  });

  it('invalide le query key après succès', () => {
    renderHook(() => useToggleUserActive());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ADMIN_USERS_QUERY_KEY }),
    );
  });

  it('définit un handler onError', () => {
    renderHook(() => useToggleUserActive());
    const { onError } = mockUseMutation.mock.calls[0][0] as { onError?: unknown };
    expect(typeof onError).toBe('function');
  });
});
