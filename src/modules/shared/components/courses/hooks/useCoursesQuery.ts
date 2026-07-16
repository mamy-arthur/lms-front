import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api/courses.api';
import { mapApiCourse } from '../lib/course-store';
import { courseKeys } from '@/shared/queries/keys';

interface Params {
  page?: number;
  perPage?: number;
  q?: string;
}

export function useCoursesQuery({ q }: Params = {}) {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: async () => {
      const res = await coursesApi.list();
      const courses = res.data.map(mapApiCourse);
      return {
        data: q
          ? courses.filter(
              (c) =>
                c.fullName.toLowerCase().includes(q.toLowerCase()) ||
                c.shortName.toLowerCase().includes(q.toLowerCase()),
            )
          : courses,
        total: res.data.length,
      };
    },
  });
}
