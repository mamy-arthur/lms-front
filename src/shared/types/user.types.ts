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
