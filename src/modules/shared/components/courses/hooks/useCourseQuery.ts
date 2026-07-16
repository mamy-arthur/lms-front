import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api/courses.api';
import { mapApiCourse } from '../lib/course-store';
import { courseKeys } from '@/shared/queries/keys';

export function useCourseQuery(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: async () => {
      const res = await coursesApi.get(id);
      return mapApiCourse(res.data);
    },
    enabled: !!id,
  });
}
