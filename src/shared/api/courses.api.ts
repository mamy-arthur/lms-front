import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib/apiClient';
import type {
  ApiCourse,
  ApiCourseCategory,
  ApiCourseSection,
  CreateCoursePayload,
  UpdateCoursePayload,
  CreateCourseCategoryPayload,
  UpdateCourseCategoryPayload,
} from '@/shared/types/course.types';

export interface CourseListParams {
  page?: number;
  per_page?: number;
  q?: string;
  category_ids?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const coursesApi = {
  list: (params: CourseListParams = {}) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('per_page', String(params.per_page ?? 25));
    if (params.q) query.set('q', params.q);
    if (params.category_ids) query.set('category_ids', params.category_ids);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    return apiGet<{ data: ApiCourse[]; meta?: { total?: number; current_page?: number; per_page?: number } }>(
      `platform/courses?${query.toString()}`,
    );
  },

  get: (id: string) => apiGet<{ data: ApiCourse }>(`platform/courses/${id}`),

  create: (data: CreateCoursePayload) => apiPost<{ data: ApiCourse }>('platform/courses', data),

  update: (id: string, data: UpdateCoursePayload) =>
    apiPatch<{ data: ApiCourse }>(`platform/courses/${id}`, data),

  remove: (id: string) => apiDelete(`platform/courses/${id}`),
};

export const courseCategoriesApi = {
  list: () => apiGet<{ data: ApiCourseCategory[] }>('platform/course-categories'),

  get: (id: string) => apiGet<{ data: ApiCourseCategory }>(`platform/course-categories/${id}`),

  create: (data: CreateCourseCategoryPayload) =>
    apiPost<{ data: ApiCourseCategory }>('platform/course-categories', data),

  update: (id: string, data: UpdateCourseCategoryPayload) =>
    apiPatch<{ data: ApiCourseCategory }>(`platform/course-categories/${id}`, data),

  remove: (id: string) => apiDelete(`platform/course-categories/${id}`),
};

export const courseSectionsApi = {
  list: (courseId: string) =>
    apiGet<{ data: ApiCourseSection[] }>(`platform/courses/${courseId}/sections`),

  get: (courseId: string, sectionId: string) =>
    apiGet<{ data: ApiCourseSection }>(`platform/courses/${courseId}/sections/${sectionId}`),

  create: (courseId: string, data: { name: string }) =>
    apiPost<{ data: ApiCourseSection }>(`platform/courses/${courseId}/sections`, data),

  update: (courseId: string, sectionId: string, data: { name?: string }) =>
    apiPatch<{ data: ApiCourseSection }>(
      `platform/courses/${courseId}/sections/${sectionId}`,
      data,
    ),

  remove: (courseId: string, sectionId: string) =>
    apiDelete(`platform/courses/${courseId}/sections/${sectionId}`),

  reorder: (courseId: string, sectionIds: string[]) =>
    apiPost<void>(`platform/courses/${courseId}/sections/reorder`, {
      section_ids: sectionIds,
    }),

  toggleVisibility: (courseId: string, sectionId: string, isHidden: boolean) =>
    apiPatch<{ data: ApiCourseSection }>(
      `platform/courses/${courseId}/sections/${sectionId}/visibility`,
      { is_hidden: isHidden },
    ),
};
