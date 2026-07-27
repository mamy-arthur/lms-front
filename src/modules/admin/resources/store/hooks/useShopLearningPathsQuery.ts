import { useQuery } from '@tanstack/react-query';
import { editorShopApi } from '@/shared/api/learning-paths.api';
import { shopLearningPathKeys } from '@/shared/queries/keys';
import type { ShopLearningPathParams } from '@/shared/types/learning-path.types';

export function useShopLearningPathsQuery(params: ShopLearningPathParams = {}) {
  return useQuery({
    queryKey: shopLearningPathKeys.list(params),
    queryFn: () => editorShopApi.list(params),
  });
}
