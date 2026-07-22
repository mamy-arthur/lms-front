import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '@/shared/lib/apiClient';
import type {
  ApiLearningPath,
  ApiLearningPathCategory,
  ApiUploadedMedia,
  CreateLearningPathCategoryPayload,
  UpdateLearningPathCategoryPayload,
  CreateLearningPathPayload,
  UpdateLearningPathPayload,
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
};
