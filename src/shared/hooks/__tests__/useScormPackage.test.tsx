/**
 * Tests unitaires — hooks package SCORM (TanStack Query)
 *
 * Le point sensible est le `staleTime` calculé par entrée : `ready` et `failed`
 * sont terminaux côté backend, donc figés dans le cache ; les statuts
 * intermédiaires doivent au contraire rester périmés, sinon un formulaire rouvert
 * après la fin du traitement resterait bloqué sur « Extraction… » — l'event
 * WebSocket, lui, n'est jamais rejoué.
 */

jest.mock('@/shared/api/scorm.api', () => ({
  scormApi: { get: jest.fn(), upload: jest.fn(), attachToEntry: jest.fn() },
}));

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { scormApi, type ApiScormPackage } from '@/shared/api/scorm.api';
import { scormPackageKeys } from '@/shared/queries/keys';
import {
  isTerminalScormStatus,
  usePatchScormPackageStatus,
  useScormPackageQuery,
  useUploadScormPackageMutation,
} from '../useScormPackage';

const mockGet = jest.mocked(scormApi.get);
const mockUpload = jest.mocked(scormApi.upload);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePackage(overrides: Partial<ApiScormPackage> = {}): ApiScormPackage {
  return {
    id: 'pkg-1',
    content_entry_id: null,
    status: 'pending',
    title: null,
    version: null,
    launch_path: null,
    failure_reason: null,
    original_filename: 'package.zip',
    size_bytes: 2048,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('isTerminalScormStatus', () => {
  it.each(['ready', 'failed'] as const)('considère "%s" comme terminal', (status) => {
    expect(isTerminalScormStatus(status)).toBe(true);
  });

  it.each(['pending', 'extracting', 'extracted'] as const)(
    'considère "%s" comme non terminal',
    (status) => {
      expect(isTerminalScormStatus(status)).toBe(false);
    },
  );

  it('traite l’absence de statut comme non terminal', () => {
    expect(isTerminalScormStatus(null)).toBe(false);
    expect(isTerminalScormStatus(undefined)).toBe(false);
  });
});

describe('useScormPackageQuery', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ne fetche rien tant qu’aucun package n’est sélectionné', () => {
    const { wrapper } = makeWrapper();

    renderHook(() => useScormPackageQuery(null), { wrapper });

    expect(mockGet).not.toHaveBeenCalled();
  });

  it('sert le cache au remontage quand le package est terminal', async () => {
    mockGet.mockResolvedValue({ data: makePackage({ status: 'ready', version: '1.2' }) });
    const { wrapper } = makeWrapper();

    const first = renderHook(() => useScormPackageQuery('pkg-1'), { wrapper });
    await waitFor(() => expect(first.result.current.data?.status).toBe('ready'));
    expect(mockGet).toHaveBeenCalledTimes(1);

    first.unmount();

    const second = renderHook(() => useScormPackageQuery('pkg-1'), { wrapper });
    await waitFor(() => expect(second.result.current.data?.status).toBe('ready'));
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('refetche au remontage tant que le traitement est en cours', async () => {
    mockGet.mockResolvedValue({ data: makePackage({ status: 'extracting' }) });
    const { wrapper } = makeWrapper();

    const first = renderHook(() => useScormPackageQuery('pkg-1'), { wrapper });
    await waitFor(() => expect(first.result.current.data?.status).toBe('extracting'));
    expect(mockGet).toHaveBeenCalledTimes(1);

    first.unmount();

    // Sans ce refetch, rouvrir le formulaire après la fin du traitement afficherait
    // indéfiniment « Extraction… » : l'event temps réel est passé pendant l'absence.
    mockGet.mockResolvedValue({ data: makePackage({ status: 'ready', version: '1.2' }) });
    const second = renderHook(() => useScormPackageQuery('pkg-1'), { wrapper });
    await waitFor(() => expect(second.result.current.data?.status).toBe('ready'));
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});

describe('usePatchScormPackageStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('applique un échec reçu par WebSocket sur le package en cache', async () => {
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(
      scormPackageKeys.detail('pkg-1'),
      makePackage({ status: 'extracted' }),
    );

    const { result } = renderHook(() => usePatchScormPackageStatus(), { wrapper });
    result.current('pkg-1', 'failed', 'Manifeste invalide.');

    const cached = queryClient.getQueryData<ApiScormPackage>(scormPackageKeys.detail('pkg-1'));
    expect(cached?.status).toBe('failed');
    expect(cached?.failure_reason).toBe('Manifeste invalide.');
  });

  it('refetche sur "ready" pour récupérer version et launch_path', async () => {
    mockGet.mockResolvedValue({
      data: makePackage({ status: 'ready', version: '1.2', launch_path: 'index.html' }),
    });
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(
      scormPackageKeys.detail('pkg-1'),
      makePackage({ status: 'extracted' }),
    );

    // La query est montée : `invalidateQueries` ne déclenche un refetch immédiat
    // que s'il existe un observateur — sans quoi l'entrée est seulement marquée
    // périmée. C'est le cas réel, le composant affichant toujours le package.
    const { result } = renderHook(
      () => ({
        query: useScormPackageQuery('pkg-1'),
        patch: usePatchScormPackageStatus(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.query.data?.status).toBe('extracted'));
    mockGet.mockClear();

    result.current.patch('pkg-1', 'ready', null);

    // L'event ne transporte pas ces champs : seul un refetch peut les fournir.
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('pkg-1'));
    await waitFor(() =>
      expect(
        queryClient.getQueryData<ApiScormPackage>(scormPackageKeys.detail('pkg-1'))?.version,
      ).toBe('1.2'),
    );
  });

  it('ignore un event portant sur un package absent du cache', () => {
    const { queryClient, wrapper } = makeWrapper();

    const { result } = renderHook(() => usePatchScormPackageStatus(), { wrapper });
    result.current('inconnu', 'failed', 'Boom');

    // Inventer un enregistrement partiel mettrait un package incomplet en cache.
    expect(queryClient.getQueryData(scormPackageKeys.detail('inconnu'))).toBeUndefined();
  });
});

describe('useUploadScormPackageMutation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('alimente le cache pour que le package soit lisible sans attendre', async () => {
    const created = makePackage({ status: 'pending' });
    mockUpload.mockResolvedValue({ data: created });
    mockGet.mockResolvedValue({ data: created });
    const { queryClient, wrapper } = makeWrapper();

    const upload = renderHook(() => useUploadScormPackageMutation(), { wrapper });
    await upload.result.current.mutateAsync({
      file: new File(['zip'], 'package.zip'),
      onProgress: jest.fn(),
    });

    // Disponible immédiatement dans le cache : la carte s'affiche sans état de
    // chargement. Une revalidation suit malgré tout, `pending` n'étant pas
    // terminal — c'est voulu, le statut peut avoir bougé entre-temps.
    expect(queryClient.getQueryData(scormPackageKeys.detail('pkg-1'))).toEqual(created);

    const read = renderHook(() => useScormPackageQuery('pkg-1'), { wrapper });
    expect(read.result.current.data).toEqual(created);
    expect(read.result.current.isLoading).toBe(false);
  });
});
