import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/lib/apiClient";
import { platformApi, CreateTenantPayload } from "@/shared/api/platform.api";
import { Tenant } from "../types";

interface TenantListResponse {
  items?: Tenant[];
  data?: Tenant[];
  total?: number;
}

export const adminTenantsApi = {
  list: (params: { page?: number; limit?: number; q?: string }) =>
    apiGet<TenantListResponse>(
      `platform/tenants?page=${params.page ?? 1}&limit=${params.limit ?? 25}${params.q ? `&q=${params.q}` : ""}`
    ),

  getById: (id: string) => apiGet<Tenant>(`platform/tenants/${id}`),

  create: (data: CreateTenantPayload) => platformApi.createTenant(data),

  update: (id: string, data: Partial<Tenant>) =>
    apiPut<{ data: Tenant }>(`platform/tenants/${id}`, data),

  remove: (id: string) => apiDelete(`platform/tenants/${id}`),
};
