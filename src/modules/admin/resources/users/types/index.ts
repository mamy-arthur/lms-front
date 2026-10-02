import { Role } from '@/shared/constants/roles';

export interface User {
  id: string;
  tenant_id: string | null;
  editor_id: string | null;
  client_id: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  profile_photo: { id: string; url: string; mime_type: string } | null;
  address: string | null;
  zip_code: string | null;
  city: string | null;
  country: string | null;
  timezone: string | null;
  preferred_language: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: Role;
  tenant_id?: string | null;
  editor_id?: string | null;
  /** Requis pour TRAINEE. Interdit pour SUPER_ADMIN et EDITOR. */
  client_id?: string | null;
  /** Requis pour CLIENT_MANAGER : crée ou réutilise le client de ce nom. */
  client_name?: string | null;
  is_active?: boolean;
  address?: string | null;
  zip_code?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  preferred_language?: string | null;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: Role;
  tenant_id?: string | null;
  client_id?: string | null;
  is_active?: boolean;
  profile_photo_media_id?: string | null;
  address?: string | null;
  zip_code?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  preferred_language?: string | null;
}

export interface UserSearchParams {
  q?: string;
  roles?: string;
  is_active?: boolean;
  tenant_id?: string;
  client_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export function normalizeUser(raw: Partial<User>): User {
  return {
    id: String(raw.id ?? ''),
    tenant_id: raw.tenant_id ?? null,
    editor_id: raw.editor_id ?? null,
    client_id: raw.client_id ?? null,
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    full_name: String(raw.full_name ?? `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim()),
    email: String(raw.email ?? ''),
    role: raw.role ?? Role.TRAINEE,
    is_active: Boolean(raw.is_active ?? true),
    profile_photo: raw.profile_photo ?? null,
    address: raw.address ?? null,
    zip_code: raw.zip_code ?? null,
    city: raw.city ?? null,
    country: raw.country ?? null,
    timezone: raw.timezone ?? null,
    preferred_language: raw.preferred_language ?? null,
    created_at: String(raw.created_at ?? ''),
    updated_at: raw.updated_at ?? null,
  };
}
