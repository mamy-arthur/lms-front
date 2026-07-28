import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '@/shared/lib/apiClient';
import type {
  ApiLearningPath,
  ApiLearningPathCategory,
  ApiLpCompetencyItem,
  ApiUploadedMedia,
  ApiShopLearningPath,
  ApiShopLearningPathsResponse,
  CreateLearningPathCategoryPayload,
  UpdateLearningPathCategoryPayload,
  CreateLearningPathPayload,
  UpdateLearningPathPayload,
  LinkCompetencyPayload,
  ShopLearningPathParams,
} from '@/shared/types/learning-path.types';

export const learningPathCategoriesApi = {
  list: () => apiGet<{ data: ApiLearningPathCategory[] }>('platform/learning-path-categories'),

  get: (id: string) =>
    apiGet<{ data: ApiLearningPathCategory }>(`platform/learning-path-categories/${id}`),

  create: (data: CreateLearningPathCategoryPayload) =>
    apiPost<{ data: ApiLearningPathCategory }>('platform/learning-path-categories', data),

  update: (id: string, data: UpdateLearningPathCategoryPayload) =>
    apiPatch<{ data: ApiLearningPathCategory }>(`platform/learning-path-categories/${id}`, data),

  remove: (id: string) => apiDelete(`platform/learning-path-categories/${id}`),
};

export const learningPathsApi = {
  list: () => apiGet<{ data: ApiLearningPath[] }>('platform/learning-paths'),

  get: (id: string) => apiGet<{ data: ApiLearningPath }>(`platform/learning-paths/${id}`),

  create: (data: CreateLearningPathPayload) =>
    apiPost<{ data: ApiLearningPath }>('platform/learning-paths', data),

  update: (id: string, data: UpdateLearningPathPayload) =>
    apiPatch<{ data: ApiLearningPath }>(`platform/learning-paths/${id}`, data),

  remove: (id: string) => apiDelete(`platform/learning-paths/${id}`),

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<{ data: ApiUploadedMedia }>('platform/learning-paths/media', formData);
  },

  linkCompetency: (id: string, data: LinkCompetencyPayload) =>
    apiPost<{ data: ApiLearningPath }>(`platform/learning-paths/${id}/competencies`, data),

  unlinkCompetency: (id: string, competencyId: string) =>
    apiDelete(`platform/learning-paths/${id}/competencies/${competencyId}`),

  listCompetencyAssociations: () =>
    apiGet<{ data: ApiLpCompetencyItem[] }>('platform/learning-path-competencies'),
};

/**
 * Boutique éditeur — routes platform/shop/learning-paths
 * Authentification : token platform (ability:platform)
 */
export const editorShopApi = {
  list: (params?: ShopLearningPathParams) =>
    apiGet<ApiShopLearningPathsResponse>(
      'platform/shop/learning-paths',
      params as Record<string, unknown>,
    ),

  get: (id: string) => apiGet<{ data: ApiShopLearningPath }>(`platform/shop/learning-paths/${id}`),
};

/**
 * Boutique client — routes shop/learning-paths
 * Authentification : token tenant (ability:tenant:{id})
 */
export const clientShopApi = {
  list: (params?: ShopLearningPathParams) =>
    apiGet<ApiShopLearningPathsResponse>('shop/learning-paths', params as Record<string, unknown>),

  get: (id: string) => apiGet<{ data: ApiShopLearningPath }>(`shop/learning-paths/${id}`),

  listCategories: () =>
    apiGet<{ data: ApiLearningPathCategory[] }>('shop/learning-path-categories'),
};
