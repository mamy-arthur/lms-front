import { useQuery } from '@tanstack/react-query';
import { clientShopApi } from '@/shared/api/learning-paths.api';
import { shopLearningPathKeys } from '@/shared/queries/keys';

export function useShopLearningPathQuery(id: string) {
  return useQuery({
    queryKey: shopLearningPathKeys.detail(id),
    queryFn: async () => {
      const res = await clientShopApi.get(id);
      return res.data;
    },
    enabled: !!id,
  });
}
