import { useQuery } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathCompetencyAssociationKeys } from '@/shared/queries/keys';

export function useLearningPathCompetencyAssociationsQuery(enabled = true) {
  return useQuery({
    queryKey: learningPathCompetencyAssociationKeys.lists(),
    queryFn: async () => {
      const res = await learningPathsApi.listCompetencyAssociations();
      return res.data;
    },
    enabled,
  });
}
