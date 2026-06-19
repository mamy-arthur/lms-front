import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/lib/apiClient";
import { User, CreateUserPayload } from "../types";

interface UserListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  tenant_id?: string;
}

interface UserListResponse {
  items?: User[];
  data?: User[];
  total?: number;
}

export const adminUsersApi = {
  list: (params: UserListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 25));
    if (params.q) query.set("q", params.q);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.tenant_id) query.set("tenant_id", params.tenant_id);
    return apiGet<UserListResponse>(`users?${query.toString()}`);
  },

  getById: (id: string) => apiGet<User>(`users/${id}`),

  create: (data: CreateUserPayload) => apiPost<{ data: User }>("users", data),

  update: (id: string, data: Partial<CreateUserPayload>) =>
    apiPut<{ data: User }>(`users/${id}`, data),

  remove: (id: string) => apiDelete(`users/${id}`),
};
