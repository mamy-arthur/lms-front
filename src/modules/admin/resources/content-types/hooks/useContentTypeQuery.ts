import { useQuery } from '@tanstack/react-query';
import { contentTypeApi } from '../api';

export const useContentType = (id: string) =>
  useQuery({
    queryKey: ['content-types', id],
    queryFn: () => contentTypeApi.getOne(id),
    enabled: !!id,
  });
