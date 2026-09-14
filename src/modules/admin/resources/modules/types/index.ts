import type { Course } from '@/modules/shared/components/courses/types';

/** What the module UI displays for a linked course — the rest lives on /platform/courses. */
export type ModuleCourse = Pick<Course, 'id' | 'fullName' | 'categoryName'>;

export interface Module {
  id: string;
  shortname: string;
  idnumber: string;
  description: string;
  /** Competency category id (backend field `category_id`). */
  category_id: string | null;
  /** Resolved category name from the list endpoint JOIN. */
  category_name: string | null;
  tenantId: string;
  courseIds: string[];
  /** Linked courses with names/categories — detail endpoints only, the list endpoint omits them. */
  courses?: ModuleCourse[];
  /** Total linked courses — from `courses_count` (list endpoint doesn't return full course ids/objects). */
  coursesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModulePayload {
  shortname: string;
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
  /** Comma-separated category ids — sent to the API as `category_ids`. */
  category?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

/** Linked course as returned by the competency detail endpoints, already resolved server-side. */
export interface CompetencyCourseApi {
  course_id: string;
  position: number;
  full_name: string | null;
  category_name: string | null;
}

/** Raw object returned by the backend /platform/competencies endpoints */
export interface CompetencyApiResponse {
  id: string;
  shortname?: string | null;
  idnumber?: string | null;
  description?: string | null;
  tenant_id?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  courses_count?: number;
  /** Course objects on detail/create/update/duplicate endpoints */
  courses?: CompetencyCourseApi[];
  /** Course UUID array on list endpoints */
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
  const linked = [...(raw.courses ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const courseIds = [...(raw.course_ids ?? []), ...linked.map((course) => course.course_id)].filter(
    Boolean,
  );

  const courses: ModuleCourse[] = linked.map((course) => ({
    id: course.course_id,
    // Falls back to the id so a course with no resolved name never renders as a blank row.
    fullName: course.full_name ?? course.course_id,
    categoryName: course.category_name ?? null,
  }));

  return {
    id: raw.id,
    shortname: raw.shortname ?? '',
    idnumber: raw.idnumber ?? '',
    description: raw.description ?? '',
    category_id: raw.category_id ?? null,
    category_name: raw.category_name ?? null,
    tenantId: raw.tenant_id ?? '',
    courseIds,
    courses,
    coursesCount: raw.courses_count ?? courseIds.length,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  };
}
