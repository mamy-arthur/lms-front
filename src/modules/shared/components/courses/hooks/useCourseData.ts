import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/shared/api/courses.api';
import { courseKeys } from '@/shared/queries/keys';
import type { Course } from '../types/index';
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

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof coursesApi.create>[0]) => coursesApi.create(payload),
    onSuccess: ({ data }) => {
      const created = mapApiCourse(data);
      queryClient.setQueryData<Course[]>(courseKeys.lists(), (prev = []) => [created, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'modules', 'available-courses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof coursesApi.update>[1]) =>
      coursesApi.update(id, payload),
    onSuccess: ({ data }) => {
      const updated = mapApiCourse(data);
      queryClient.setQueryData<Course[]>(courseKeys.lists(), (prev = []) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Course[]>(courseKeys.lists(), (prev = []) =>
        prev.filter((c) => c.id !== id),
      );
    },
  });

  return { coursesQuery, createMutation, updateMutation, deleteMutation };
}
