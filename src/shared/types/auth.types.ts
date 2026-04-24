import { Role } from "@/shared/constants/roles";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}