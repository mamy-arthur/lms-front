import { useQuery } from '@tanstack/react-query';
import { learningPathsApi, type LearningPathListParams } from '@/shared/api/learning-paths.api';
import { learningPathKeys } from '@/shared/queries/keys';
import { normalizeLearningPath } from '../types';

export function useLearningPathsQuery(params?: LearningPathListParams) {
  return useQuery({
    queryKey: params ? learningPathKeys.list(params) : learningPathKeys.lists(),
    queryFn: async () => {
      const res = await learningPathsApi.list(params);
      return {
        data: res.data.map(normalizeLearningPath),
        total: res.meta?.total ?? res.data.length,
      };
    },
  });
}
