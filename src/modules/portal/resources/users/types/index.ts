import { Role, TENANT_ROLES } from '@/shared/constants/roles';

export interface ClientUser {
  id: string;
  tenant_id: string | null;
  editor_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  profile_photo: { id: string; url: string; mime_type: string } | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateClientUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
  tenant_id?: string | null;
  is_active?: boolean;
}

export interface UpdateClientUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: Role;
  is_active?: boolean;
  profile_photo_media_id?: string | null;
}

export const TENANT_USER_ROLES: readonly Role[] = TENANT_ROLES;

export interface ClientUserSearchParams {
  q?: string;
  role?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export function normalizeClientUser(raw: Record<string, unknown>): ClientUser {
  return {
    id: String(raw.id ?? ''),
    tenant_id: (raw.tenant_id as string | null) ?? null,
    editor_id: (raw.editor_id as string | null) ?? null,
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    full_name: String(raw.full_name ?? `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim()),
    email: String(raw.email ?? ''),
    role: (raw.role ?? Role.TRAINEE) as Role,
    is_active: Boolean(raw.is_active ?? raw.isActive ?? true),
    profile_photo: (raw.profile_photo as ClientUser['profile_photo']) ?? null,
    created_at: String(raw.created_at ?? ''),
    updated_at: (raw.updated_at as string | null) ?? null,
  };
}
