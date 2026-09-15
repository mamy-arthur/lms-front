import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseCategoriesApi } from '@/shared/api/courses.api';
import { competencyKeys, courseKeys, courseCategoryKeys } from '@/shared/queries/keys';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      // Competency payloads embed the category name of their linked courses.
      queryClient.invalidateQueries({ queryKey: competencyKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseCategoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: competencyKeys.all });
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
