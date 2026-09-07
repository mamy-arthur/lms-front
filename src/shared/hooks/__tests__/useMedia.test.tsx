/**
 * Tests unitaires — hooks media (TanStack Query)
 *
 * L'objectif du refactor était d'arrêter de refetcher les mêmes médias à chaque
 * montage. Ces tests comptent donc les appels réseau, pas seulement le rendu :
 * une régression du cache se verrait ici par un compteur qui augmente.
 */

jest.mock('@/shared/api/media.api', () => ({
  mediaApi: {
    get: jest.fn(),
    upload: jest.fn(),
    uploadWithProgress: jest.fn(),
    uploadInline: jest.fn(),
    delete: jest.fn(),
  },
}));

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { mediaApi, type ApiMedia } from '@/shared/api/media.api';
import { mediaKeys } from '@/shared/queries/keys';
import {
  useDeleteMediaMutation,
  useMediaListQuery,
  useMediaQuery,
  useUploadMediaMutation,
} from '../useMedia';

const mockGet = jest.mocked(mediaApi.get);
const mockUploadWithProgress = jest.mocked(mediaApi.uploadWithProgress);
const mockDelete = jest.mocked(mediaApi.delete);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeMedia(id: string): ApiMedia {
  return {
    id,
    original_name: `${id}.png`,
    url: `https://cdn.test/${id}.png`,
    mime_type: 'image/png',
    size_bytes: 1024,
    created_at: '2026-01-01T00:00:00Z',
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

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

describe('hooks media', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation((id: string) => Promise.resolve({ data: makeMedia(id) }));
  });

  describe('useMediaQuery', () => {
    it('récupère le média une seule fois puis sert le cache au remontage', async () => {
      const { wrapper } = makeWrapper();

      const first = renderHook(() => useMediaQuery('m-1'), { wrapper });
      await waitFor(() => expect(first.result.current.data).toBeDefined());
      expect(mockGet).toHaveBeenCalledTimes(1);

      first.unmount();

      // Remontage : c'est exactement le scénario « on change d'entrée puis on
      // revient » qui déclenchait un appel réseau à chaque fois.
      const second = renderHook(() => useMediaQuery('m-1'), { wrapper });
      await waitFor(() => expect(second.result.current.data).toBeDefined());
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('ne déclenche aucun appel tant qu’aucun média n’est sélectionné', () => {
      const { wrapper } = makeWrapper();

      renderHook(() => useMediaQuery(null), { wrapper });

      expect(mockGet).not.toHaveBeenCalled();
    });

    it('refetche quand la valeur du champ change de média', async () => {
      const { wrapper } = makeWrapper();

      const { result, rerender } = renderHook(({ id }: { id: string }) => useMediaQuery(id), {
        wrapper,
        initialProps: { id: 'm-1' },
      });
      await waitFor(() => expect(result.current.data?.id).toBe('m-1'));

      // L'ancien useEffect(…, []) ignorait ce changement et affichait un média périmé.
      rerender({ id: 'm-2' });
      await waitFor(() => expect(result.current.data?.id).toBe('m-2'));
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    it('ne réessaie pas indéfiniment un média introuvable', async () => {
      mockGet.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => useMediaQuery('gone'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });

  describe('useMediaListQuery', () => {
    it('ne demande que les médias absents du cache', async () => {
      const { wrapper } = makeWrapper();

      const first = renderHook(() => useMediaListQuery(['m-1', 'm-2']), { wrapper });
      await waitFor(() => expect(first.result.current.data).toHaveLength(2));
      expect(mockGet).toHaveBeenCalledTimes(2);

      first.unmount();
      mockGet.mockClear();

      // m-1 et m-2 viennent du cache ; seul m-3 part sur le réseau.
      const second = renderHook(() => useMediaListQuery(['m-1', 'm-2', 'm-3']), { wrapper });
      await waitFor(() => expect(second.result.current.data).toHaveLength(3));
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('m-3');
    });

    it('partage son cache avec useMediaQuery', async () => {
      const { wrapper } = makeWrapper();

      const list = renderHook(() => useMediaListQuery(['m-1']), { wrapper });
      await waitFor(() => expect(list.result.current.data).toHaveLength(1));
      mockGet.mockClear();

      const single = renderHook(() => useMediaQuery('m-1'), { wrapper });
      await waitFor(() => expect(single.result.current.data?.id).toBe('m-1'));
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('ignore les médias introuvables plutôt que de trouer la liste', async () => {
      mockGet.mockImplementation((id: string) =>
        id === 'gone'
          ? Promise.reject(new Error('Not Found'))
          : Promise.resolve({ data: makeMedia(id) }),
      );
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => useMediaListQuery(['m-1', 'gone']), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data.map((m) => m.id)).toEqual(['m-1']);
    });

    it('ne fait aucun appel pour une liste vide', () => {
      const { wrapper } = makeWrapper();

      const { result } = renderHook(() => useMediaListQuery([]), { wrapper });

      expect(result.current.data).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('useUploadMediaMutation', () => {
    it('alimente le cache pour que le média uploadé ne soit jamais re-téléchargé', async () => {
      const uploaded = makeMedia('m-new');
      mockUploadWithProgress.mockResolvedValue({ data: uploaded });
      const { wrapper } = makeWrapper();

      const upload = renderHook(() => useUploadMediaMutation(), { wrapper });
      await upload.result.current.mutateAsync({
        file: new File(['x'], 'x.png'),
        contentTypeId: 'ct-1',
        fieldId: 'f-1',
        onProgress: jest.fn(),
      });

      const read = renderHook(() => useMediaQuery('m-new'), { wrapper });
      await waitFor(() => expect(read.result.current.data).toEqual(uploaded));
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  describe('useDeleteMediaMutation', () => {
    it('évince l’entrée du cache pour qu’un média supprimé ne soit plus servi', async () => {
      mockDelete.mockResolvedValue(undefined);
      const { queryClient, wrapper } = makeWrapper();
      queryClient.setQueryData(mediaKeys.detail('m-1'), makeMedia('m-1'));

      const { result } = renderHook(() => useDeleteMediaMutation(), { wrapper });
      await result.current.mutateAsync('m-1');

      expect(queryClient.getQueryData(mediaKeys.detail('m-1'))).toBeUndefined();
    });
  });
});
