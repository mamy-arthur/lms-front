import { useQuery } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathCompetencyAssociationKeys } from '@/shared/queries/keys';
import type { ApiLpCompetencyItem } from '@/shared/types/learning-path.types';

export function useLearningPathCompetencyAssociationsQuery(enabled = true) {
  return useQuery<ApiLpCompetencyItem[]>({
    queryKey: learningPathCompetencyAssociationKeys.lists(),
    queryFn: async () => {
      const res = await learningPathsApi.listCompetencyAssociations();
      return res.data;
    },
    enabled,
  });
}
