import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib/apiClient';
import { Course } from '../../../../shared/components/courses/types';

interface CourseListResponse {
  items?: Course[];
  data?: Course[];
  total?: number;
}

export const adminCoursesApi = {
  list: (params: { page?: number; limit?: number; q?: string }) =>
    apiGet<CourseListResponse>(
      `courses?page=${params.page ?? 1}&limit=${params.limit ?? 25}${params.q ? `&q=${params.q}` : ''}`,
    ),

  getById: (id: string) => apiGet<Course>(`courses/${id}`),

  create: (data: Partial<Course>) => apiPost<Course>('courses', data),

  update: (id: string, data: Partial<Course>) => apiPut<Course>(`courses/${id}`, data),

  remove: (id: string) => apiDelete(`courses/${id}`),
};
