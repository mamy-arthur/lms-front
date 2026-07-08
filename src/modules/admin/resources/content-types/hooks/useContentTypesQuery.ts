import { useQuery } from '@tanstack/react-query';
import { contentTypeApi } from '../api';

export const CONTENT_TYPES_KEY = ['content-types'] as const;

export const useContentTypes = () =>
  useQuery({
    queryKey: CONTENT_TYPES_KEY,
    queryFn: contentTypeApi.getAll,
  });
