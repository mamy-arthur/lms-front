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

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
  tenant_id?: string | null;
  editor_id?: string | null;
  is_active?: boolean;
}

export function normalizeUser(raw: Record<string, unknown>): User {
  const fullName =
    String(raw.full_name ?? "") ||
    String(raw.name ?? raw.fullName ?? "") ||
    [raw.first_name, raw.last_name].filter(Boolean).join(" ");

  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: fullName,
    email: String(raw.email ?? ""),
    role: (raw.role ?? raw.roleAlias ?? Role.TRAINEE) as Role,
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.active),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}
