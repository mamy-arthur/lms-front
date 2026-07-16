import { apiGet, apiDelete, apiUpload } from '@/shared/lib/apiClient';

export interface ApiMedia {
  id: string;
  original_name: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export const mediaApi = {
  upload: (file: File, contentTypeId: string, fieldId: string): Promise<{ data: ApiMedia }> => {
    const form = new FormData();
    form.append('file', file);
    form.append('content_type_id', contentTypeId);
    form.append('field_id', fieldId);
    return apiUpload<{ data: ApiMedia }>('platform/media', form);
  },
  get: (id: string): Promise<{ data: ApiMedia }> =>
    apiGet<{ data: ApiMedia }>(`platform/media/${id}`),

  delete: (id: string): Promise<void> =>
    apiDelete(`platform/media/${id}`),
};
