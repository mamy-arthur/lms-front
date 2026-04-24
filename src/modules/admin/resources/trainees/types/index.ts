export interface Trainee {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  isActive: boolean;
  enrolledCourses: number;
  createdAt: string;
}

export function normalizeTrainee(raw: Record<string, unknown>): Trainee {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? raw.fullName ?? raw.nom ?? ""),
    email: String(raw.email ?? ""),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.active),
    enrolledCourses: Number(raw.enrolledCourses ?? 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}
