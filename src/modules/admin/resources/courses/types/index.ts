export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  tenantId: string;
  isPublished: boolean;
  createdAt: string;
}

export function normalizeCourse(raw: Record<string, unknown>): Course {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    title: String(raw.title ?? raw.titre ?? ""),
    slug: String(raw.slug ?? ""),
    description: String(raw.description ?? ""),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    isPublished: Boolean(raw.isPublished ?? raw.is_published ?? raw.published),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}
