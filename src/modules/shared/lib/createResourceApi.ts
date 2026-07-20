import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '@/shared/lib/apiClient';

interface ListResponse {
  data?: Record<string, unknown>[];
  total?: number;
}

interface MediaUploadResponse {
  data: { id: string; url: string; mime_type: string; original_name: string };
}

/**
 * Crée un client API CRUD standard pour une ressource donnée.
 * Toutes les méthodes (list, create, update, remove, duplicate, uploadMedia)
 * sont générées à partir du `basePath`.
 *
 * @param basePath - Préfixe de l'URL (ex: `'platform/template-mails'` ou `'template-mails'`)
 */
export function createResourceApi<TEntity, TCreate, TUpdate>(basePath: string) {
  return {
    list: (params?: Record<string, unknown>) => apiGet<ListResponse>(basePath, params),

    getById: (id: string) => apiGet<{ data: TEntity }>(`${basePath}/${id}`),

    create: (data: TCreate) => apiPost<{ data: TEntity }>(basePath, data),

    update: (id: string, data: TUpdate) => apiPatch<{ data: TEntity }>(`${basePath}/${id}`, data),

    remove: (id: string) => apiDelete(`${basePath}/${id}`),

    duplicate: (id: string) => apiPost<{ data: TEntity }>(`${basePath}/${id}/duplicate`),

    uploadMedia: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiUpload<MediaUploadResponse>(`${basePath}/media`, formData);
    },
  };
}
