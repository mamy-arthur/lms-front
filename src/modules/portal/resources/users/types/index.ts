import { Role, TENANT_ROLES } from '@/shared/constants/roles';

export interface ClientUser {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  city: string;
  country: string;
  lastLogin: string;
  createdAt: string;
}

export interface CreateClientUserPayload {
  first_name: string;
  last_name: string;
  username?: string;
  email: string;
  password: string;
  role: Role;
  tenant_id?: string | null;
  is_active?: boolean;
  city?: string;
  country?: string;
}

export interface UpdateClientUserPayload {
  first_name: string;
  last_name: string;
  username?: string;
  email: string;
  password?: string;
  role: Role;
  is_active?: boolean;
  city?: string;
  country?: string;
}

export const TENANT_USER_ROLES: readonly Role[] = TENANT_ROLES;

export interface ClientUserSearchParams {
  q?: string;
  role?: string;
  status?: 'active' | 'inactive';
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export function normalizeClientUser(raw: Record<string, unknown>): ClientUser {
  const first_name = String(raw.first_name ?? raw.firstName ?? '');
  const last_name = String(raw.last_name ?? raw.lastName ?? '');
  const username =
    String(raw.username ?? '') ||
    String(raw.full_name ?? '') ||
    String(raw.name ?? '') ||
    [first_name, last_name].filter(Boolean).join('.');

  return {
    id: String(raw.id ?? raw._id ?? ''),
    first_name,
    last_name,
    username: username || '—',
    email: String(raw.email ?? ''),
    role: (raw.role ?? raw.roleAlias ?? Role.TRAINEE) as Role,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.active ?? true),
    city: String(raw.city ?? ''),
    country: String(raw.country ?? ''),
    lastLogin: String(raw.lastLogin ?? raw.last_login ?? raw.last_logged_in ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
  };
}
