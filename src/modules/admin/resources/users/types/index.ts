import { Role } from '@/shared/constants/roles';

export type { User } from '@/shared/types/user.types';

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

export { normalizeUser } from '@/shared/lib/normalizeUser';
