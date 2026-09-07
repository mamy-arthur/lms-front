import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyKeys } from '@/shared/queries/keys';
import { competencyCategoriesApi } from '../api';
import { COMPETENCY_CATEGORIES_QUERY_KEY } from './useCompetencyCategoriesQuery';

export function useDeleteCompetencyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => competencyCategoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPETENCY_CATEGORIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: competencyKeys.lists() });
    },
  });
}
