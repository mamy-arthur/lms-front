import { useQuery } from '@tanstack/react-query';
import { competencyCategoriesApi } from '../api';

export const COMPETENCY_CATEGORIES_QUERY_KEY = [
  'admin',
  'modules',
  'competency-categories',
] as const;

export function useCompetencyCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: COMPETENCY_CATEGORIES_QUERY_KEY,
    queryFn: () => competencyCategoriesApi.list(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min — les catégories changent rarement
  });
}
