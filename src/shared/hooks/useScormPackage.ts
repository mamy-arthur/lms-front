'use client';

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scormApi, type ApiScormPackage, type ScormPackageStatus } from '@/shared/api/scorm.api';
import { scormPackageKeys } from '@/shared/queries/keys';

/**
 * Centralised TanStack Query access to `scormApi`.
 *
 * A SCORM package moves through pending → extracting → extracted → ready|failed.
 * `ready` and `failed` are **terminal**: nothing on the backend transitions out of
 * them, which is what lets the cache treat them as permanently fresh — and what
 * lets the UI stop listening for further status events.
 */

/** Statuses the backend never transitions out of. */
export const TERMINAL_SCORM_STATUSES: ScormPackageStatus[] = ['ready', 'failed'];

export function isTerminalScormStatus(status: ScormPackageStatus | null | undefined): boolean {
  return !!status && TERMINAL_SCORM_STATUSES.includes(status);
}

/**
 * A package by id.
 *
 * `staleTime` is computed per cache entry rather than fixed: once terminal the
 * record can never change, so remounting the form reads from cache. While it is
 * still processing the entry stays stale, so coming back to a form that was left
 * open mid-extraction refetches the real status instead of showing a frozen
 * "Extraction…" that the WebSocket already announced and will not replay.
 */
export function useScormPackageQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: scormPackageKeys.detail(id ?? ''),
    queryFn: () => scormApi.get(id!).then((r) => r.data),
    enabled: !!id,
    staleTime: (query) => (isTerminalScormStatus(query.state.data?.status) ? Infinity : 0),
    retry: false,
  });
}

/** Writes a package into the cache — used by the upload and by socket events. */
export function useSeedScormPackageCache() {
  const queryClient = useQueryClient();

  return useCallback(
    (pkg: ApiScormPackage) => {
      queryClient.setQueryData(scormPackageKeys.detail(pkg.id), pkg);
    },
    [queryClient],
  );
}

/**
 * Applies a status pushed over the WebSocket onto the cached package.
 *
 * Patching the cache rather than holding the status in component state keeps one
 * source of truth: the query. A status arriving for a package we have never
 * fetched is ignored — there is no record to patch, and inventing a partial one
 * would put a half-empty package in the cache.
 */
export function usePatchScormPackageStatus() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string, status: ScormPackageStatus, failureReason: string | null) => {
      queryClient.setQueryData<ApiScormPackage>(scormPackageKeys.detail(id), (prev) =>
        prev ? { ...prev, status, failure_reason: failureReason ?? prev.failure_reason } : prev,
      );

      // `ready` carries the parsed title/version/launch_path, which the event does
      // not: refetch once so the card can show them.
      if (status === 'ready') {
        void queryClient.invalidateQueries({ queryKey: scormPackageKeys.detail(id) });
      }
    },
    [queryClient],
  );
}

interface UploadScormVars {
  file: File;
  onProgress: (percent: number) => void;
}

/**
 * Uploads a package and seeds the created record into the cache.
 *
 * Seeding makes the card render immediately from the upload response instead of
 * flashing a loading state. It does NOT suppress the revalidation that follows:
 * a freshly created package is `pending`, i.e. non-terminal, so `staleTime` is 0
 * and the query re-checks it on mount — which is the behaviour we want, since a
 * status can change between the upload response and the first render.
 */
export function useUploadScormPackageMutation() {
  const seed = useSeedScormPackageCache();

  return useMutation({
    mutationFn: ({ file, onProgress }: UploadScormVars) =>
      scormApi.upload(file, onProgress).then((r) => r.data),
    onSuccess: seed,
  });
}
