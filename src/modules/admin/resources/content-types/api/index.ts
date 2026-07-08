import { apiGet, apiPost, apiPut } from '@/shared/lib/apiClient';
import type { ContentType, CreateContentTypePayload, UpdateContentTypePayload } from '../types';

export const contentTypeApi = {
  getAll: () => apiGet<{ data: ContentType[] }>('platform/content-types'),

  getOne: (id: string) => apiGet<{ data: ContentType }>(`platform/content-types/${id}`),

  create: (payload: CreateContentTypePayload) =>
    apiPost<{ data: ContentType }, CreateContentTypePayload>('platform/content-types', payload),

  update: (id: string, payload: UpdateContentTypePayload) =>
    apiPut<{ data: ContentType }, UpdateContentTypePayload>(`platform/content-types/${id}`, payload),

  getFieldTypes: () => apiGet<{ data: string[] }>('platform/field-types'),

  getMediaMimeTypes: () => apiGet<{ data: string[] }>('platform/media-mime-types'),
};
