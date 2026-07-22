import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyCategoriesApi } from '../api';
import type { CreateCompetencyCategoryPayload } from '../types';
import { COMPETENCY_CATEGORIES_QUERY_KEY } from './useCompetencyCategoriesQuery';

export function useCreateCompetencyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCompetencyCategoryPayload) =>
      competencyCategoriesApi.create(payload),
    onSuccess: () => {
      // Rafraîchit la liste côté UI pour rendre la nouvelle catégorie sélectionnable.
      queryClient.invalidateQueries({ queryKey: COMPETENCY_CATEGORIES_QUERY_KEY });
    },
  });
}
