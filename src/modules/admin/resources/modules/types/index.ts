import type { Module } from '@/modules/shared/lib/normalizers';
export type { Module };

export interface ModulePayload {
  shortname: string;
  idnumber: string;
  description?: string;
  category_id: string;
  course_ids: string[];
}

/** @alias ModulePayload */
export type CreateModulePayload = ModulePayload;
/** @alias ModulePayload */
export type UpdateModulePayload = ModulePayload;

export interface ModuleSearchParams {
  q?: string;
  /** Frontend-only — not sent to the API (pour l'instant). */
  category?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export type AvailableCourseStatus = 'AVAILABLE' | 'ALREADY_LINKED';

/** Course item returned by GET /platform/competencies/available-courses */
export interface AvailableCourse {
  id: string;
  fullName: string;
  categoryId: string;
  categoryName: string;
  status: AvailableCourseStatus;
}

/** Raw object returned by the backend /platform/competencies endpoints */
export interface CompetencyApiResponse {
  id: string;
  shortname?: string | null;
  idnumber?: string | null;
  description?: string | null;
  tenant_id?: string | null;
  category_id?: string | null;
  /** Course objects on detail/duplicate endpoints */
  courses?: Array<{ id: string }>;
  /** Course UUID array on list/create/update endpoints */
  course_ids?: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CompetencyListApiResponse {
  data: CompetencyApiResponse[];
  /** Laravel pagination uses `meta.total`; some endpoints expose `total` at root */
  meta?: {
    total?: number;
    current_page?: number;
    per_page?: number;
  };
  total?: number;
}

export interface CompetencyCategory {
  id: string;
  tenant_id: string;
  name: string;
  idnumber: string;
  description: string | null;
  visible: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCompetencyCategoryPayload {
  name: string;
  idnumber: string;
  description?: string | null;
  visible: boolean;
}

export interface UpdateCompetencyCategoryPayload {
  name?: string;
  idnumber?: string;
  description?: string | null;
  visible?: boolean;
}

/** Maps a backend CompetencyApiResponse to the frontend Module model. */
export function normalizeModule(raw: CompetencyApiResponse): Module {
  // Handle any course shape: string UUIDs, { id }, { course_id }, full objects
  const extractId = (item: unknown): string => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      return String(o.id ?? o.course_id ?? o.courseId ?? '');
    }
    return '';
  };
  const courseIds = [
    ...(raw.course_ids ?? []).map(extractId),
    ...(raw.courses ?? []).map(extractId),
  ].filter(Boolean);

  return {
    id: raw.id,
    shortname: raw.shortname ?? '',
    idnumber: raw.idnumber ?? '',
    description: raw.description ?? '',
    category_id: raw.category_id ?? null,
    tenantId: raw.tenant_id ?? '',
    courseIds,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  };
}
