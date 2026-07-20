import { useQuery } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';
import { normalizeLearningPath } from '../types';

export function useLearningPathsQuery() {
  return useQuery({
    queryKey: learningPathKeys.lists(),
    queryFn: async () => {
      const res = await learningPathsApi.list();
      return res.data.map(normalizeLearningPath);
    },
  });
}
