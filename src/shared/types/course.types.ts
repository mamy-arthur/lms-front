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
}

export interface UpdateContentEntryPayload {
  data?: Record<string, unknown>;
  is_published?: boolean;
}
