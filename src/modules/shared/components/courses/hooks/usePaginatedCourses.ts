import { useQuery } from '@tanstack/react-query';
import { coursesApi, type CourseListParams } from '@/shared/api/courses.api';
import { courseKeys } from '@/shared/queries/keys';
import { mapApiCourse } from '../lib/course-mappers';

export function usePaginatedCourses(params: CourseListParams) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: async () => {
      const res = await coursesApi.list(params);
      return {
        data: res.data.map(mapApiCourse),
        total: res.meta?.total ?? res.data.length,
      };
    },
    placeholderData: (prev) => prev,
  });
}
