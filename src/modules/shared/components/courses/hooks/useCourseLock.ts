'use client';

import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api/courses.api';
import { courseKeys } from '@/shared/queries/keys';
import {
  CATALOG_LOCK_UNLOCKED,
  normalizeCatalogLock,
  type CatalogLock,
} from '@/shared/types/catalog-lock.types';

/**
 * Whether this course's structure is frozen by a sale, and which (module,
 * learning path) pairs are responsible.
 *
 * Reads the course detail rather than the content tree: the backend answers the
 * lock with a single EXISTS query there, without loading sections or entries.
 *
 * While the request is in flight the course reports as unlocked, so the controls
 * are never greyed out on a guess. The refusal is enforced server-side anyway —
 * this only decides what the UI shows.
 */
export function useCourseLock(courseId: string): CatalogLock {
  const { data } = useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => coursesApi.get(courseId).then((r) => r.data),
    enabled: !!courseId,
  });

  return data ? normalizeCatalogLock(data) : CATALOG_LOCK_UNLOCKED;
}
