import { useInfiniteQuery } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api/courses.api';
import { courseKeys } from '@/shared/queries/keys';
import { mapApiCourse } from '../lib/course-mappers';

const PAGE_SIZE = 20;

interface Params {
  q?: string;
  category_ids?: string | null;
}

/**
 * Paginated course catalogue, for pickers browsing the whole tenant library.
 * Restricted to published courses: pickers add courses to a module, and drafts
 * aren't ready to be surfaced there.
 */
export function useCoursesInfinite(params: Params, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...courseKeys.lists(), 'infinite', params],
    queryFn: async ({ pageParam }) => {
      const res = await coursesApi.list({
        page: pageParam,
        per_page: PAGE_SIZE,
        q: params.q || undefined,
        category_ids: params.category_ids || undefined,
        visibility: 'PUBLISHED',
      });
      const items = res.data ?? [];
      return {
        data: items.map(mapApiCourse),
        total: res.meta?.total ?? items.length,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled,
    // Refresh eligibility when reopening the picker after editing course content.
    staleTime: 0,
  });
}
