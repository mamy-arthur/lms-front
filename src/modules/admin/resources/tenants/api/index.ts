import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/lib/apiClient";
import { BackendTenant, CreateTenantPayload, Tenant, UpdateTenantPayload } from "@/shared/types/tenants/tenant";

export const tenantApi = {
    getAll: () => apiGet<{ data: Tenant[] }>("platform/tenants"),

    create: (payload: CreateTenantPayload) =>
        apiPost<{ data: BackendTenant }>("platform/tenants", payload),

    update: (id: string, payload: UpdateTenantPayload) =>
        apiPut<{ data: BackendTenant }>(`platform/tenants/${id}`, payload),

    remove: (id: string) => apiDelete(`platform/tenants/${id}`),
};
