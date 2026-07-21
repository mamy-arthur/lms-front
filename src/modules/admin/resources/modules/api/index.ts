/**
 * Modules API — backed by /platform/competencies.
 */
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, apiPatch } from '@/shared/lib/apiClient';
import type {
  CompetencyApiResponse,
  CompetencyListApiResponse,
  CompetencyCategory,
  CreateCompetencyCategoryPayload,
  UpdateCompetencyCategoryPayload,
  CreateModulePayload,
  UpdateModulePayload,
  AvailableCourse,
} from '../types';

const BASE = 'platform/competencies';
const CATEGORY_BASE = 'platform/competency-categories';

interface ListParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface AvailableCourseRaw {
  id: string;
  full_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
}

export const adminModulesApi = {
  list: (params: ListParams) => {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('per_page', String(params.per_page ?? 25));
    if (params.q) query.set('q', params.q);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    return apiGet<CompetencyListApiResponse>(`${BASE}?${query.toString()}`);
  },

  getById: (id: string) =>
    apiGet<{ data: CompetencyApiResponse }>(`${BASE}/${id}`),

  create: (payload: CreateModulePayload) =>
    apiPost<{ data: CompetencyApiResponse }, CreateModulePayload>(BASE, payload),

  update: (id: string, payload: UpdateModulePayload) =>
    apiPut<{ data: CompetencyApiResponse }, UpdateModulePayload>(`${BASE}/${id}`, payload),

  remove: (id: string) => apiDelete(`${BASE}/${id}`),

  duplicate: (id: string, shortname?: string) =>
    apiPost<{ data: CompetencyApiResponse }>(`${BASE}/${id}/duplicate`, shortname ? { shortname } : {}),

  uploadMedia: async (file: File): Promise<{ id: string; url: string; mimeType: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiUpload<{ data: { id: string; url: string; mime_type: string } }>(
      `${BASE}/media`,
      form,
    );
    return { id: res.data.id, url: res.data.url, mimeType: res.data.mime_type };
  },

  availableCourses: async (competencyId?: string): Promise<AvailableCourse[]> => {
    const url = competencyId
      ? `${BASE}/available-courses?competency_id=${encodeURIComponent(competencyId)}`
      : `${BASE}/available-courses`;
    const res = await apiGet<{ data: AvailableCourseRaw[] }>(url);
    return (res.data ?? []).map((c) => ({
      id: c.id,
      fullName: String(c.full_name ?? ''),
      categoryId: c.category_id ?? '',
      categoryName: String(c.category_name ?? ''),
    }));
  },
};

export const competencyCategoriesApi = {
  list: async (): Promise<CompetencyCategory[]> => {
    const res = await apiGet<{ data: CompetencyCategory[] }>(CATEGORY_BASE);
    return res.data ?? [];
  },
  getById: (id: string) =>
    apiGet<{ data: CompetencyCategory }>(`${CATEGORY_BASE}/${id}`).then((r) => r.data),
  create: (payload: CreateCompetencyCategoryPayload) =>
    apiPost<{ data: CompetencyCategory }, CreateCompetencyCategoryPayload>(CATEGORY_BASE, payload)
      .then((r) => r.data),
  update: (id: string, payload: UpdateCompetencyCategoryPayload) =>
    apiPut<{ data: CompetencyCategory }, UpdateCompetencyCategoryPayload>(`${CATEGORY_BASE}/${id}`, payload).then(
      (r) => r.data,
    ),
  patch: (id: string, payload: UpdateCompetencyCategoryPayload) =>
    apiPatch<{ data: CompetencyCategory }, UpdateCompetencyCategoryPayload>(
      `${CATEGORY_BASE}/${id}`,
      payload,
    ).then((r) => r.data),
  remove: (id: string) => apiDelete(`${CATEGORY_BASE}/${id}`),
};
