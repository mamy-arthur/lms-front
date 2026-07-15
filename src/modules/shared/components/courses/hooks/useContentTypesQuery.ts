import { useQuery } from '@tanstack/react-query';
import { contentTypeApi } from '@/shared/api/content-type.api';
import { contentTypeKeys } from '@/shared/queries/keys';

export function useContentTypesQuery() {
  return useQuery({
    queryKey: contentTypeKeys.lists(),
    queryFn: () => contentTypeApi.list(),
    select: (res) => res.data,
  });
}
