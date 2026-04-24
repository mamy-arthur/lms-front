import { Role } from "@/shared/constants/roles";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

export function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? raw.fullName ?? raw.nom ?? ""),
    email: String(raw.email ?? ""),
    role: (raw.role ?? raw.roleAlias ?? Role.TRAINEE) as Role,
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.active),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}
