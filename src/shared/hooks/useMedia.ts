'use client';

import { useCallback } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi, type ApiMedia } from '@/shared/api/media.api';
import { mediaKeys } from '@/shared/queries/keys';

/**
 * Centralised TanStack Query access to `mediaApi`.
 *
 * A media record is immutable server-side: the API exposes create (`POST /media`),
 * read and delete, but no update route — id, url, name, size and mime type never
 * change once uploaded. Cached entries therefore never go stale on their own,
 * which is why `staleTime` is Infinity: remounting a form field, switching
 * content entries and navigating back all read from cache instead of refetching.
 *
 * The cache is keyed per media id (not per field or per entry) so the same file
 * referenced from several places resolves to a single cache entry.
 */

/** Long enough to survive navigating away from a form and coming back. */
const MEDIA_GC_TIME = 30 * 60 * 1000;

const mediaQueryOptions = (id: string) => ({
  queryKey: mediaKeys.detail(id),
  queryFn: () => mediaApi.get(id).then((r) => r.data),
  staleTime: Infinity,
  gcTime: MEDIA_GC_TIME,
  // A deleted or orphaned media returns 404 — retrying cannot fix that and only
  // delays the empty state.
  retry: false,
});

/** Single media by id. Pass `null` when the field has no value yet. */
export function useMediaQuery(id: string | null | undefined) {
  return useQuery({
    ...mediaQueryOptions(id ?? ''),
    enabled: !!id,
  });
}

/**
 * Several media at once, each cached under its own key — so ids already fetched
 * by another field (or a previous mount) resolve from cache and only the missing
 * ones hit the network.
 */
export function useMediaListQuery(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => mediaQueryOptions(id)),
    combine: (results) => ({
      // Orphaned/failed ids are dropped rather than rendered as holes, matching
      // the previous behaviour where a failed batch simply showed nothing.
      data: results.flatMap((r) => (r.data ? [r.data] : [])),
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });
}

/**
 * Writes an uploaded media straight into the cache.
 *
 * Without this the record would be held in component state only, and the very
 * next remount would fetch back over the network something we already had.
 */
export function useSeedMediaCache() {
  const queryClient = useQueryClient();

  return useCallback(
    (media: ApiMedia) => {
      queryClient.setQueryData(mediaKeys.detail(media.id), media);
    },
    [queryClient],
  );
}

interface UploadVars {
  file: File;
  contentTypeId: string;
  fieldId: string;
  onProgress?: (percent: number) => void;
}

/** Upload with optional progress; the result is seeded into the cache on success. */
export function useUploadMediaMutation() {
  const seed = useSeedMediaCache();

  return useMutation({
    mutationFn: ({ file, contentTypeId, fieldId, onProgress }: UploadVars) =>
      onProgress
        ? mediaApi.uploadWithProgress(file, contentTypeId, fieldId, onProgress).then((r) => r.data)
        : mediaApi.upload(file, contentTypeId, fieldId).then((r) => r.data),
    onSuccess: seed,
  });
}

/** Inline (rich-text) upload. Also seeded — the same id may be read back later. */
export function useUploadInlineMediaMutation() {
  const seed = useSeedMediaCache();

  return useMutation({
    mutationFn: ({ file, contentTypeId, fieldId }: Omit<UploadVars, 'onProgress'>) =>
      mediaApi.uploadInline(file, contentTypeId, fieldId).then((r) => r.data),
    onSuccess: seed,
  });
}

/** Deletes a media and drops its cache entry, so nothing serves it afterwards. */
export function useDeleteMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: mediaKeys.detail(id) });
    },
  });
}

/**
 * Imperative delete for the ids a form accumulated while the user edited it —
 * they are only flushed on submit, outside any React render.
 */
export function useDeleteMediaBatch() {
  const queryClient = useQueryClient();

  return useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;

      await Promise.allSettled(ids.map((id) => mediaApi.delete(id)));
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: mediaKeys.detail(id) });
      }
    },
    [queryClient],
  );
}
