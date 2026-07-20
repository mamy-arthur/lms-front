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

export const coursesApi = {
  list: () => apiGet<{ data: ApiCourse[] }>('platform/courses'),

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
