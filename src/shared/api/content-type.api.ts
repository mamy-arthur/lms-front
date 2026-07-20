import { apiGet } from '@/shared/lib/apiClient';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

export const contentTypeApi = {
  list: () => apiGet<{ data: ContentTypeResource[] }>('platform/content-types'),
  get: (id: string) => apiGet<{ data: ContentTypeResource }>(`platform/content-types/${id}`),
};
