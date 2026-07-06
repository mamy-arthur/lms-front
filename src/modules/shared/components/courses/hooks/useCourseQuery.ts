import { useQuery } from '@tanstack/react-query';
import { adminCoursesApi } from '../../../../admin/resources/courses/api';

export function useCourseQuery(id: string) {
  return useQuery({
    queryKey: ['admin', 'courses', id],
    queryFn: async () => {
      await adminCoursesApi.getById(id);
      return [];
    },
    enabled: !!id,
  });
}
