import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/lib/apiClient";
import { User } from "../types";

interface UserListParams {
  page?: number;
  limit?: number;
  q?: string;
}

interface UserListResponse {
  items?: User[];
  data?: User[];
  total?: number;
}

export const adminUsersApi = {
  list: (params: UserListParams) =>
    apiGet<UserListResponse>(
      `users?page=${params.page ?? 1}&limit=${params.limit ?? 25}${params.q ? `&q=${params.q}` : ""}`
    ),

  getById: (id: string) => apiGet<User>(`users/${id}`),

  create: (data: Partial<User>) => apiPost<User>("users", data),

  update: (id: string, data: Partial<User>) => apiPut<User>(`users/${id}`, data),

  remove: (id: string) => apiDelete(`users/${id}`),
};
