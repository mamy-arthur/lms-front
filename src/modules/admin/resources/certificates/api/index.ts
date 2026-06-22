import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/lib/apiClient";
import type {
  Certificate,
  CreateCertificatePayload,
  UpdateCertificatePayload,
} from "../types";

interface CertificateListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  tenant_id?: string;
  status?: "active" | "inactive";
}

interface CertificateListResponse {
  items?: Certificate[];
  data?: Certificate[];
  total?: number;
}

export const adminCertificatesApi = {
  list: (params: CertificateListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 25));
    if (params.q) query.set("q", params.q);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.tenant_id) query.set("tenant_id", params.tenant_id);
    if (params.status) query.set("status", params.status);
    return apiGet<CertificateListResponse>(
      `admin/certificates?${query.toString()}`,
    );
  },

  getById: (id: string) => apiGet<Certificate>(`admin/certificates/${id}`),

  create: (data: CreateCertificatePayload) =>
    apiPost<{ data: Certificate }>("admin/certificates", data),

  update: (id: string, data: UpdateCertificatePayload) =>
    apiPut<{ data: Certificate }>(`admin/certificates/${id}`, data),

  remove: (id: string) => apiDelete(`admin/certificates/${id}`),
};
