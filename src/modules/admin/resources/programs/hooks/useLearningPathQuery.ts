import { useQuery } from '@tanstack/react-query';
import { learningPathsApi } from '../api';
import { learningPathKeys } from '@/shared/queries/keys';
import { normalizeLearningPath } from '../types';

export function useLearningPathQuery(id: string | null) {
  return useQuery({
    queryKey: learningPathKeys.detail(id ?? ''),
    queryFn: async () => {
      const res = await learningPathsApi.get(id!);
      return normalizeLearningPath(res.data);
    },
    enabled: !!id,
  });
}
