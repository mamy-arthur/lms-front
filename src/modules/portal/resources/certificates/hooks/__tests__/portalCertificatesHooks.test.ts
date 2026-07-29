/**
 * Tests unitaires — hooks portal certificates
 *
 * Couvre :
 *  - usePortalCertificatesQuery : query key, normalisation, total, params, erreurs
 *  - useCreatePortalCertificate : mutationFn + invalidation du cache
 *  - useUpdatePortalCertificate : mutationFn ({ id, data }) + invalidation
 *  - useDeletePortalCertificate : mutationFn (id) + invalidation
 *  - useDuplicatePortalCertificate : mutationFn (id) + invalidation
 */

jest.mock('@/shared/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
  apiUpload: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib/apiClient';

import {
  usePortalCertificatesQuery,
  PORTAL_CERTIFICATES_QUERY_KEY,
} from '../usePortalCertificatesQuery';
import { useCreatePortalCertificate } from '../useCreatePortalCertificate';
import { useUpdatePortalCertificate } from '../useUpdatePortalCertificate';
import { useDeletePortalCertificate } from '../useDeletePortalCertificate';
import { useDuplicatePortalCertificate } from '../useDuplicatePortalCertificate';

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseQueryClient = jest.mocked(useQueryClient);
const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const RAW_CERT = {
  id: 'cert-001',
  reference: 'CERT-REF-001',
  name: 'Attestation de formation',
  is_active: true,
  is_default_template: true,
  tenant_id: 'tenant-1',
  body: '<p>Attestation</p>',
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-06-15T12:00:00Z',
};

const mockInvalidateQueries = jest.fn();

// ─── usePortalCertificatesQuery ───────────────────────────────────────────────

describe('usePortalCertificatesQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>);
  });

  it('utilise le bon query key de base', () => {
    renderHook(() => usePortalCertificatesQuery());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...PORTAL_CERTIFICATES_QUERY_KEY, undefined],
      }),
    );
  });

  it('intègre les params dans le query key', () => {
    const params = { q: 'attestation', page: 1 };
    renderHook(() => usePortalCertificatesQuery(params));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...PORTAL_CERTIFICATES_QUERY_KEY, params],
      }),
    );
  });

  it('la queryFn normalise les données et retourne { data, total }', async () => {
    mockApiGet.mockResolvedValue({ data: [RAW_CERT], total: 1 });
    renderHook(() => usePortalCertificatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'cert-001',
      name: 'Attestation de formation',
      isActive: true,
      isDefaultTemplate: true,
      tenantId: 'tenant-1',
    });
    expect(result.total).toBe(1);
  });

  it('utilise data.length comme total si total absent', async () => {
    mockApiGet.mockResolvedValue({ data: [RAW_CERT, RAW_CERT] });
    renderHook(() => usePortalCertificatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.total).toBe(2);
  });

  it('gère un tableau vide sans erreur', async () => {
    mockApiGet.mockResolvedValue({ data: [], total: 0 });
    renderHook(() => usePortalCertificatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('active placeholderData', () => {
    renderHook(() => usePortalCertificatesQuery());
    const options = mockUseQuery.mock.calls[0][0] as { placeholderData?: unknown };
    expect(typeof options.placeholderData).toBe('function');
  });

  it('la queryFn transmet les params à buildResourceQueryParams', async () => {
    mockApiGet.mockResolvedValue({ data: [], total: 0 });
    const params = { q: 'gorille', page: 2 };
    renderHook(() => usePortalCertificatesQuery(params));

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<unknown>;
    };

    await queryFn({});
    expect(mockApiGet).toHaveBeenCalledWith('certificates', { q: 'gorille', page: 2 });
  });

  it('category est transformé en status par buildResourceQueryParams', async () => {
    mockApiGet.mockResolvedValue({ data: [], total: 0 });
    renderHook(() => usePortalCertificatesQuery({ category: 'active' }));

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<unknown>;
    };

    await queryFn({});
    // buildResourceQueryParams transforme category → status
    expect(mockApiGet).toHaveBeenCalledWith('certificates', { status: 'active' });
  });

  it('la queryFn propage une erreur API 500', async () => {
    mockApiGet.mockRejectedValue(Object.assign(new Error('Server Error'), { status: 500 }));
    renderHook(() => usePortalCertificatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<unknown>;
    };

    await expect(queryFn({})).rejects.toMatchObject({ status: 500 });
  });
});

// ─── useCreatePortalCertificate ───────────────────────────────────────────────

describe('useCreatePortalCertificate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('la mutationFn appelle POST certificates avec le payload', async () => {
    mockApiPost.mockResolvedValue({ data: RAW_CERT });
    renderHook(() => useCreatePortalCertificate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (payload: unknown) => Promise<unknown>;
    };

    const payload = {
      name: 'Test',
      status: true,
      setasdefault: false,
      body: '<p>Corps</p>',
      tenant_id: 'tenant-1',
    };
    await mutationFn(payload);
    expect(mockApiPost).toHaveBeenCalledWith('certificates', payload);
  });

  it('invalide PORTAL_CERTIFICATES_QUERY_KEY après succès', () => {
    renderHook(() => useCreatePortalCertificate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_CERTIFICATES_QUERY_KEY }),
    );
  });
});

// ─── useUpdatePortalCertificate ───────────────────────────────────────────────

describe('useUpdatePortalCertificate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('la mutationFn appelle PATCH certificates/{id} avec les données', async () => {
    mockApiPatch.mockResolvedValue({ data: RAW_CERT });
    renderHook(() => useUpdatePortalCertificate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (args: { id: string; data: unknown }) => Promise<unknown>;
    };

    await mutationFn({ id: 'cert-001', data: { name: 'Modifié' } });
    expect(mockApiPatch).toHaveBeenCalledWith('certificates/cert-001', { name: 'Modifié' });
  });

  it('invalide le query key après succès', () => {
    renderHook(() => useUpdatePortalCertificate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_CERTIFICATES_QUERY_KEY }),
    );
  });
});

// ─── useDeletePortalCertificate ───────────────────────────────────────────────

describe('useDeletePortalCertificate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('la mutationFn appelle DELETE certificates/{id}', async () => {
    mockApiDelete.mockResolvedValue(undefined);
    renderHook(() => useDeletePortalCertificate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (id: string) => Promise<unknown>;
    };

    await mutationFn('cert-001');
    expect(mockApiDelete).toHaveBeenCalledWith('certificates/cert-001');
  });

  it('invalide le query key après suppression', () => {
    renderHook(() => useDeletePortalCertificate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_CERTIFICATES_QUERY_KEY }),
    );
  });
});

// ─── useDuplicatePortalCertificate ────────────────────────────────────────────

describe('useDuplicatePortalCertificate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('la mutationFn appelle POST certificates/{id}/duplicate', async () => {
    mockApiPost.mockResolvedValue({ data: { ...RAW_CERT, id: 'cert-002' } });
    renderHook(() => useDuplicatePortalCertificate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (id: string) => Promise<unknown>;
    };

    await mutationFn('cert-001');
    expect(mockApiPost).toHaveBeenCalledWith('certificates/cert-001/duplicate');
  });

  it('invalide le query key après duplication', () => {
    renderHook(() => useDuplicatePortalCertificate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_CERTIFICATES_QUERY_KEY }),
    );
  });
});
