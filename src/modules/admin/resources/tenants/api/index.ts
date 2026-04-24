import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/lib/apiClient";
import { Tenant } from "../types";

interface TenantListResponse {
  items?: Tenant[];
  data?: Tenant[];
  total?: number;
}

export const adminTenantsApi = {
  list: (params: { page?: number; limit?: number; q?: string }) =>
    apiGet<TenantListResponse>(
      `tenants?page=${params.page ?? 1}&limit=${params.limit ?? 25}${params.q ? `&q=${params.q}` : ""}`
    ),

  getById: (id: string) => apiGet<Tenant>(`tenants/${id}`),

  create: (data: Partial<Tenant>) => apiPost<Tenant>("tenants", data),

  update: (id: string, data: Partial<Tenant>) =>
    apiPut<Tenant>(`tenants/${id}`, data),

  remove: (id: string) => apiDelete(`tenants/${id}`),
};
