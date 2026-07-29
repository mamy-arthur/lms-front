/**
 * Tests unitaires — hooks portal mail-templates
 *
 * Couvre :
 *  - usePortalMailTemplatesQuery : query key, normalisation, total
 *  - useCreatePortalMailTemplate : appel create + invalidation
 *  - useUpdatePortalMailTemplate : appel update avec id + data + invalidation
 *  - useDeletePortalMailTemplate : appel remove + invalidation
 *  - useDuplicatePortalMailTemplate : appel duplicate + invalidation
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
  usePortalMailTemplatesQuery,
  PORTAL_MAIL_TEMPLATES_QUERY_KEY,
} from '../usePortalMailTemplatesQuery';
import { useCreatePortalMailTemplate } from '../useCreatePortalMailTemplate';
import { useUpdatePortalMailTemplate } from '../useUpdatePortalMailTemplate';
import { useDeletePortalMailTemplate } from '../useDeletePortalMailTemplate';
import { useDuplicatePortalMailTemplate } from '../useDuplicatePortalMailTemplate';

const mockUseQuery = jest.mocked(useQuery);
const mockUseMutation = jest.mocked(useMutation);
const mockUseQueryClient = jest.mocked(useQueryClient);
const mockApiGet = jest.mocked(apiGet);
const mockApiPost = jest.mocked(apiPost);
const mockApiPatch = jest.mocked(apiPatch);
const mockApiDelete = jest.mocked(apiDelete);

const RAW_TEMPLATE = {
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

const mockInvalidateQueries = jest.fn();

// ─── usePortalMailTemplatesQuery ──────────────────────────────────────────────

describe('usePortalMailTemplatesQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>);
  });

  it('utilise le bon query key', () => {
    renderHook(() => usePortalMailTemplatesQuery());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...PORTAL_MAIL_TEMPLATES_QUERY_KEY, undefined],
      }),
    );
  });

  it('intègre les params dans le query key', () => {
    const params = { q: 'confirm', page: 1 };
    renderHook(() => usePortalMailTemplatesQuery(params));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [...PORTAL_MAIL_TEMPLATES_QUERY_KEY, params],
      }),
    );
  });

  it('la queryFn appelle portalMailTemplatesApi.list et normalise les données', async () => {
    mockApiGet.mockResolvedValue({ data: [RAW_TEMPLATE], total: 1 });
    renderHook(() => usePortalMailTemplatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(mockApiGet).toHaveBeenCalledWith('template-mails', {});
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'tpl-001',
      name: "Confirmation d'inscription",
      isActive: true,
      tenantId: 'tenant-1',
    });
    expect(result.total).toBe(1);
  });

  it('utilise data.length comme total si total absent de la réponse', async () => {
    mockApiGet.mockResolvedValue({ data: [RAW_TEMPLATE, RAW_TEMPLATE] });
    renderHook(() => usePortalMailTemplatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.total).toBe(2);
  });

  it('gère un tableau vide sans erreur', async () => {
    mockApiGet.mockResolvedValue({ data: [], total: 0 });
    renderHook(() => usePortalMailTemplatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<{ data: unknown[]; total: number }>;
    };

    const result = await queryFn({});
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('active placeholderData', () => {
    renderHook(() => usePortalMailTemplatesQuery());
    const options = mockUseQuery.mock.calls[0][0] as { placeholderData?: unknown };
    expect(typeof options.placeholderData).toBe('function');
  });

  it('la queryFn propage une erreur API', async () => {
    mockApiGet.mockRejectedValue(Object.assign(new Error('Server Error'), { status: 500 }));
    renderHook(() => usePortalMailTemplatesQuery());

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<unknown>;
    };

    await expect(queryFn({})).rejects.toMatchObject({ status: 500 });
  });

  it('la queryFn transmet les params à buildResourceQueryParams', async () => {
    mockApiGet.mockResolvedValue({ data: [], total: 0 });
    const params = { q: 'bienvenue', page: 2 };
    renderHook(() => usePortalMailTemplatesQuery(params));

    const { queryFn } = mockUseQuery.mock.calls[0][0] as {
      queryFn: (...args: unknown[]) => Promise<unknown>;
    };

    await queryFn({});
    // buildResourceQueryParams({ q, page }) → { q, page } (pas de category)
    expect(mockApiGet).toHaveBeenCalledWith('template-mails', { q: 'bienvenue', page: 2 });
  });
});

// ─── useCreatePortalMailTemplate ──────────────────────────────────────────────

describe('useCreatePortalMailTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('appelle useMutation avec une mutationFn qui appelle POST template-mails', async () => {
    mockApiPost.mockResolvedValue({ data: RAW_TEMPLATE });
    renderHook(() => useCreatePortalMailTemplate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (payload: unknown) => Promise<unknown>;
    };

    const payload = { name: 'Test', subject: 'Sujet', body: '<p>Corps</p>' };
    await mutationFn(payload);
    expect(mockApiPost).toHaveBeenCalledWith('template-mails', payload);
  });

  it('invalide le query key PORTAL_MAIL_TEMPLATES_QUERY_KEY après succès', async () => {
    renderHook(() => useCreatePortalMailTemplate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as {
      onSuccess: () => void;
    };

    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY }),
    );
  });
});

// ─── useUpdatePortalMailTemplate ──────────────────────────────────────────────

describe('useUpdatePortalMailTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('appelle PATCH template-mails/{id} avec les données', async () => {
    mockApiPatch.mockResolvedValue({ data: RAW_TEMPLATE });
    renderHook(() => useUpdatePortalMailTemplate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (args: { id: string; data: unknown }) => Promise<unknown>;
    };

    await mutationFn({ id: 'tpl-001', data: { name: 'Modifié' } });
    expect(mockApiPatch).toHaveBeenCalledWith('template-mails/tpl-001', { name: 'Modifié' });
  });

  it('invalide le query key après succès', () => {
    renderHook(() => useUpdatePortalMailTemplate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY }),
    );
  });
});

// ─── useDeletePortalMailTemplate ──────────────────────────────────────────────

describe('useDeletePortalMailTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('appelle DELETE template-mails/{id}', async () => {
    mockApiDelete.mockResolvedValue(undefined);
    renderHook(() => useDeletePortalMailTemplate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (id: string) => Promise<unknown>;
    };

    await mutationFn('tpl-001');
    expect(mockApiDelete).toHaveBeenCalledWith('template-mails/tpl-001');
  });

  it('invalide le query key après suppression', () => {
    renderHook(() => useDeletePortalMailTemplate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY }),
    );
  });
});

// ─── useDuplicatePortalMailTemplate ──────────────────────────────────────────

describe('useDuplicatePortalMailTemplate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    mockUseMutation.mockReturnValue({} as unknown as ReturnType<typeof useMutation>);
  });

  it('appelle POST template-mails/{id}/duplicate', async () => {
    mockApiPost.mockResolvedValue({ data: { ...RAW_TEMPLATE, id: 'tpl-002' } });
    renderHook(() => useDuplicatePortalMailTemplate());

    const { mutationFn } = mockUseMutation.mock.calls[0][0] as {
      mutationFn: (id: string) => Promise<unknown>;
    };

    await mutationFn('tpl-001');
    expect(mockApiPost).toHaveBeenCalledWith('template-mails/tpl-001/duplicate');
  });

  it('invalide le query key après duplication', () => {
    renderHook(() => useDuplicatePortalMailTemplate());

    const { onSuccess } = mockUseMutation.mock.calls[0][0] as { onSuccess: () => void };
    onSuccess();
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: PORTAL_MAIL_TEMPLATES_QUERY_KEY }),
    );
  });
});
