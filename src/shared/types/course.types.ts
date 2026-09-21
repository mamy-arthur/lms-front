import type { ApiCatalogLockOrigin } from '@/shared/types/catalog-lock.types';

export type CourseVisibility = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ApiCourse {
  id: string;
  tenant_id: string;
  created_by: string;
  full_name: string;
  short_name: string;
  id_number: string | null;
  category_id: string | null;
  category_name?: string | null;
  visibility: CourseVisibility;
  description: string | null;
  created_at: string;
  updated_at: string;
  /** Number of content entries across all sections; returned by the course listing. */
  content_count?: number;
  /**
   * Catalogue sale lock. Carried by the READ endpoints — `GET /platform/courses`
   * resolves it in batch for the whole page, `GET /platform/courses/{id}` and
   * `.../content` for the course asked — and ABSENT from the create/update
   * responses, which serialise the course entity alone.
   *
   * Optional therefore means "not answered here", never "unlocked": a course
   * echoed back by a PATCH carries no lock, and must not be read as a free one.
   */
  is_locked?: boolean;
  lock_origins?: ApiCatalogLockOrigin[];
}

export interface ApiCourseCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  children: ApiCourseCategory[];
  created_at: string;
  updated_at: string;
}

export interface ApiCourseSection {
  id: string;
  course_id: string;
  tenant_id: string;
  name: string;
  rank: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiContentEntry {
  id: string;
  content_type_id: string;
  course_section_id: string;
  /** Position within the section, 0-based. Returned by the API; drives list ordering. */
  rank: number;
  content_type_version: number;
  data: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiContentEntryListResponse {
  data: ApiContentEntry[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface CreateCoursePayload {
  full_name: string;
  short_name: string;
  visibility?: CourseVisibility;
  category_id: string | null;
  description?: string | null;
}

export interface UpdateCoursePayload {
  full_name?: string;
  short_name?: string;
  visibility?: CourseVisibility;
  category_id?: string | null;
  description?: string | null;
}

export interface CreateCourseCategoryPayload {
  name: string;
  description?: string | null;
  parent_id?: string | null;
}

export interface UpdateCourseCategoryPayload {
  name?: string;
  description?: string | null;
}

export interface CreateContentEntryPayload {
  content_type_id: string;
  data: Record<string, unknown>;
  /** Attaches an already-uploaded SCORM package atomically (may still be `pending`). */
  scorm_package_id?: string;
}

export interface UpdateContentEntryPayload {
  data?: Record<string, unknown>;
  is_published?: boolean;
}

export interface MoveContentEntryPayload {
  /** Destination section — the same id as the current one when reordering in place. */
  course_section_id: string;
  /** Target 0-based index in the destination section, after the move. */
  position: number;
}
