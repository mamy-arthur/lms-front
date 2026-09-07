import { useQuery } from '@tanstack/react-query';
import { contentTypeApi } from '@/shared/api/content-type.api';
import { contentTypeKeys } from '@/shared/queries/keys';

/** List all active content types (GET /platform/content-types). */
export function useContentTypesQuery() {
  return useQuery({
    queryKey: contentTypeKeys.lists(),
    queryFn: () => contentTypeApi.list(),
    select: (res) => res.data,
  });
}

/**
 * Fetch the full schema of a single content type (GET /platform/content-types/{id}).
 * Use this when you need the most up-to-date `fields` array for a given type.
 */
export function useContentTypeQuery(id: string | undefined) {
  return useQuery({
    queryKey: contentTypeKeys.detail(id ?? ''),
    queryFn: () => contentTypeApi.get(id!),
    select: (res) => res.data,
    enabled: !!id,
  });
}
