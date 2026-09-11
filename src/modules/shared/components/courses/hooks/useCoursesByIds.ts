import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api/courses.api';
import { courseKeys } from '@/shared/queries/keys';
import { mapApiCourse } from '../lib/course-mappers';
import type { Course } from '../types';

/** Backend caps `per_page` at 100, so at most 100 ids can be resolved in one call. */
const MAX_IDS = 100;

/**
 * Resolves courses from a known set of ids, to display names for a selection
 * whose members may not be on the currently browsed page.
 */
export function useCoursesByIds(ids: string[]) {
  const requestedIds = [...new Set(ids)].sort();
  const idsParam = requestedIds.join(',');

  return useQuery<Course[]>({
    queryKey: [...courseKeys.all, 'by-ids', idsParam],
    queryFn: async () => {
      const courses: Course[] = [];
      for (let offset = 0; offset < requestedIds.length; offset += MAX_IDS) {
        const batch = requestedIds.slice(offset, offset + MAX_IDS);
        const res = await coursesApi.list({ ids: batch.join(','), per_page: batch.length });
        courses.push(...(res.data ?? []).map(mapApiCourse));
      }
      return courses;
    },
    enabled: requestedIds.length > 0,
    placeholderData: (prev) => prev,
  });
}
