/**
 * Tests unitaires — useMoveEntry (réordonnancement des content entries)
 *
 * Couvre le contrat demandé côté UI :
 *  - l'ordre est mis à jour dans le cache AVANT la réponse serveur (optimiste) ;
 *  - l'ordre précédent est restauré à l'identique si l'API échoue ;
 *  - la position envoyée à l'API est l'index cible dans la section.
 *
 * Un vrai QueryClient est utilisé (et non un mock de react-query) : le rollback
 * vit dans onMutate/onError, il ne serait pas réellement testé autrement.
 */

jest.mock('@/shared/api/content-entries.api', () => ({
  contentEntriesApi: { move: jest.fn() },
}));

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { contentEntriesApi } from '@/shared/api/content-entries.api';
import { contentEntryKeys } from '@/shared/queries/keys';
import type { ApiContentEntry } from '@/shared/types/course.types';
import { useMoveEntry } from '../useCourseContentApi';

const mockMove = jest.mocked(contentEntriesApi.move);

const SECTION_ID = 'section-1';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntry(id: string, rank: number): ApiContentEntry {
  return {
    id,
    content_type_id: 'ct-1',
    course_section_id: SECTION_ID,
    rank,
    content_type_version: 1,
    data: { title: id.toUpperCase() },
    is_published: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

const INITIAL: ApiContentEntry[] = [makeEntry('a', 0), makeEntry('b', 1), makeEntry('c', 2)];

// ─── Helper ───────────────────────────────────────────────────────────────────

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(contentEntryKeys.list(SECTION_ID), INITIAL);

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useMoveEntry(SECTION_ID), { wrapper });

  const currentOrder = () =>
    (queryClient.getQueryData<ApiContentEntry[]>(contentEntryKeys.list(SECTION_ID)) ?? []).map(
      (e) => e.id,
    );

  return { queryClient, result, currentOrder };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useMoveEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it("réordonne le cache avant que l'API ne réponde", async () => {
    // La requête ne se résout jamais pendant l'assertion : seul l'effet optimiste
    // peut donc expliquer le nouvel ordre.
    let resolveMove: () => void = () => {};
    mockMove.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveMove = resolve;
      }),
    );

    const { result, currentOrder } = setup();

    result.current.mutate({ entryId: 'c', orderedIds: ['c', 'a', 'b'], position: 0 });

    await waitFor(() => expect(currentOrder()).toEqual(['c', 'a', 'b']));
    expect(mockMove).toHaveBeenCalledTimes(1);

    resolveMove();
  });

  it('renumérote les rangs de façon contiguë lors de la mise à jour optimiste', async () => {
    mockMove.mockResolvedValue(undefined);

    const { queryClient, result } = setup();

    result.current.mutate({ entryId: 'a', orderedIds: ['b', 'c', 'a'], position: 2 });

    await waitFor(() => {
      const entries =
        queryClient.getQueryData<ApiContentEntry[]>(contentEntryKeys.list(SECTION_ID)) ?? [];
      expect(entries.map((e) => [e.id, e.rank])).toEqual([
        ['b', 0],
        ['c', 1],
        ['a', 2],
      ]);
    });
  });

  it("envoie la section et l'index cible à l'API", async () => {
    mockMove.mockResolvedValue(undefined);

    const { result } = setup();

    result.current.mutate({ entryId: 'a', orderedIds: ['b', 'c', 'a'], position: 2 });

    await waitFor(() =>
      expect(mockMove).toHaveBeenCalledWith('a', {
        course_section_id: SECTION_ID,
        position: 2,
      }),
    );
  });

  it("restaure l'ordre précédent quand l'API échoue", async () => {
    mockMove.mockRejectedValue(new Error('Server error'));

    const { result, currentOrder } = setup();

    result.current.mutate({ entryId: 'c', orderedIds: ['c', 'a', 'b'], position: 0 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(currentOrder()).toEqual(['a', 'b', 'c']);
  });

  it('restaure aussi les rangs, pas seulement la position dans le tableau', async () => {
    mockMove.mockRejectedValue(new Error('Server error'));

    const { queryClient, result } = setup();

    result.current.mutate({ entryId: 'c', orderedIds: ['c', 'a', 'b'], position: 0 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const entries =
      queryClient.getQueryData<ApiContentEntry[]>(contentEntryKeys.list(SECTION_ID)) ?? [];
    expect(entries.map((e) => [e.id, e.rank])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });

  it('ignore un id inconnu au lieu de produire une entrée vide dans la liste', async () => {
    mockMove.mockResolvedValue(undefined);

    const { result, currentOrder } = setup();

    // Peut arriver si la liste a été rafraîchie entre le drag et le drop.
    result.current.mutate({
      entryId: 'a',
      orderedIds: ['b', 'disparue', 'a'],
      position: 2,
    });

    await waitFor(() => expect(currentOrder()).toEqual(['b', 'a']));
  });
});
