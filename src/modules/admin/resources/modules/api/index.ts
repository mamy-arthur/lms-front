import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/lib/apiClient";
import type { Module, CreateModulePayload } from "../types";

interface ModuleListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  category?: string;
  tenant_id?: string;
}

interface ModuleListResponse {
  items?: Module[];
  data?: Module[];
  total?: number;
}

export const adminModulesApi = {
  list: (params: ModuleListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 25));
    if (params.q) query.set("q", params.q);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.category) query.set("category", params.category);
    if (params.tenant_id) query.set("tenant_id", params.tenant_id);
    return apiGet<ModuleListResponse>(`admin/modules?${query.toString()}`);
  },

  getById: (id: string) => apiGet<Module>(`admin/modules/${id}`),

  create: (data: CreateModulePayload) =>
    apiPost<{ data: Module }>("admin/modules", data),

  update: (id: string, data: Partial<CreateModulePayload>) =>
    apiPut<{ data: Module }>(`admin/modules/${id}`, data),

  remove: (id: string) => apiDelete(`admin/modules/${id}`),
};
