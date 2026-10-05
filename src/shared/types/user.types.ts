import type { Role } from '@/shared/constants/roles';

export interface ApiUserProfilePhoto {
  id: string;
  url: string;
  mime_type: string;
}

/** Champs utilisés pour les stagiaires assignables (GET /users?role=TRAINEE). */
export interface ApiAssignableTraineeUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  role?: string;
  profile_photo: ApiUserProfilePhoto | null;
}

export interface UsersListParams {
  role?: string;
  page?: number;
  page_size?: number;
}

export interface ApiUsersListResponse {
  data: ApiAssignableTraineeUser[];
  total: number;
}

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
