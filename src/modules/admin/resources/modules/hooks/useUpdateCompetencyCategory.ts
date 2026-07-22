import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyCategoriesApi } from '../api';
import type { UpdateCompetencyCategoryPayload } from '../types';
import { COMPETENCY_CATEGORIES_QUERY_KEY } from './useCompetencyCategoriesQuery';

export function useUpdateCompetencyCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompetencyCategoryPayload }) =>
      competencyCategoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPETENCY_CATEGORIES_QUERY_KEY });
    },
  });
}
