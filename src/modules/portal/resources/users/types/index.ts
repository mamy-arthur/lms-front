import { Role, TENANT_ROLES } from "@/shared/constants/roles";

// ─── Domain type ─────────────────────────────────────────────────────────────

export interface TenantUser {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  city: string;
  country: string;
  lastLogin: string;
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
  city?: string;
  country?: string;
}

export interface UpdateTenantUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: Role;
  is_active?: boolean;
  city?: string;
  country?: string;
}

// ─── Roles available in tenant context ───────────────────────────────────────

export const TENANT_USER_ROLES: readonly Role[] = TENANT_ROLES; // CLIENT_MANAGER, TRAINEE

// ─── Normalizer (pure function) ──────────────────────────────────────────────

export function normalizeTenantUser(raw: Record<string, unknown>): TenantUser {
  const first_name = String(raw.first_name ?? raw.firstName ?? "");
  const last_name = String(raw.last_name ?? raw.lastName ?? "");
  const fullName =
    String(raw.full_name ?? "") ||
    String(raw.name ?? raw.fullName ?? "") ||
    [first_name, last_name].filter(Boolean).join(" ");

  return {
    id: String(raw.id ?? raw._id ?? ""),
    first_name,
    last_name,
    name: fullName.trim() || "—",
    email: String(raw.email ?? ""),
    role: (raw.role ?? raw.roleAlias ?? Role.TRAINEE) as Role,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.active ?? true),
    city: String(raw.city ?? ""),
    country: String(raw.country ?? ""),
    lastLogin: String(
      raw.lastLogin ?? raw.last_login ?? raw.last_logged_in ?? "",
    ),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}
