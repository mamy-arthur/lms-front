import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyCategoriesApi } from '../api';
import { COMPETENCY_CATEGORIES_QUERY_KEY } from './useCompetencyCategoriesQuery';
import { ADMIN_MODULES_QUERY_KEY } from './useModules';

export function useDeleteCompetencyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => competencyCategoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPETENCY_CATEGORIES_QUERY_KEY });
      // Les modules affichés peuvent dépendre du nom de catégorie.
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULES_QUERY_KEY });
    },
  });
}
