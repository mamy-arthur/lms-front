import type { User } from '@/shared/types/user.types';
import { Role } from '@/shared/constants/roles';

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
