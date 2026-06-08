import { Role, TENANT_ROLES } from "@/shared/constants/roles";

// ─── Domain type ─────────────────────────────────────────────────────────────

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// ─── API payload ─────────────────────────────────────────────────────────────

export interface CreateTenantUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
  tenant_id?: string | null;
  is_active?: boolean;
}

// ─── Roles available in tenant context ───────────────────────────────────────

export const TENANT_USER_ROLES: readonly Role[] = TENANT_ROLES; // CLIENT_MANAGER, TRAINEE

// ─── Normalizer (pure function) ──────────────────────────────────────────────

export function normalizeTenantUser(raw: Record<string, unknown>): TenantUser {
  const fullName =
    String(raw.full_name ?? "") ||
    String(raw.name ?? raw.fullName ?? "") ||
    [raw.first_name, raw.last_name].filter(Boolean).join(" ");

  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: fullName.trim() || "—",
    email: String(raw.email ?? ""),
    role: (raw.role ?? raw.roleAlias ?? Role.TRAINEE) as Role,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.active ?? true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}
