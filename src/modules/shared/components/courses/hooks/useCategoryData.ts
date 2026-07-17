import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseCategoriesApi } from '@/shared/api/courses.api';
import { courseKeys, courseCategoryKeys } from '@/shared/queries/keys';
import type { Category } from '../types/index';
import { mapApiCategory, flattenCategories } from '../lib/course-mappers';

export function useCategoryData() {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: courseCategoryKeys.lists(),
    queryFn: async () => {
      const res = await courseCategoriesApi.list();
      return flattenCategories(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof courseCategoriesApi.create>[0]) =>
      courseCategoriesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Parameters<typeof courseCategoriesApi.update>[1]) =>
      courseCategoriesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseCategoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });

  return {
    categoriesQuery,
    createMutation,
    updateMutation,
    deleteMutation,
    mapApiCategory,
  };
}
