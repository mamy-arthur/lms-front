import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api/courses.api';
import { courseKeys } from '@/shared/queries/keys';
import { mapApiCourse } from '../lib/course-mappers';

export function useCourseData() {
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: courseKeys.lists(),
    queryFn: async () => {
      const res = await coursesApi.list();
      return res.data.map(mapApiCourse);
    },
  });

  const invalidateCourses = () => queryClient.invalidateQueries({ queryKey: courseKeys.lists() });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof coursesApi.create>[0]) => coursesApi.create(payload),
    onSuccess: () => {
      invalidateCourses();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof coursesApi.update>[1]) =>
      coursesApi.update(id, payload),
    onSuccess: () => {
      invalidateCourses();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: () => {
      invalidateCourses();
    },
  });

  return { coursesQuery, createMutation, updateMutation, deleteMutation };
}
