export interface Module {
  id: string;
  name: string;
  identifier: string;
  description: string;
  category: string;
  courseIds: string[];
  createdAt: string;
}

export interface CreateModulePayload {
  name: string;
  identifier: string;
  description?: string;
  category: string;
  course_ids: string[];
}

export interface UpdateModulePayload {
  name: string;
  identifier: string;
  description?: string;
  category: string;
  course_ids: string[];
}

export interface ModuleSearchParams {
  q?: string;
  category?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export function normalizeModule(raw: Record<string, unknown>): Module {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? raw.fullName ?? ""),
    identifier: String(raw.identifier ?? ""),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? ""),
    courseIds: (() => {
      const ids = raw.courseIds ?? raw.course_ids;
      return Array.isArray(ids) ? ids.map(String) : [];
    })(),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}
