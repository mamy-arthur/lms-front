import { apiGet } from "@/shared/lib/apiClient";
import type { Certificate } from "../types";

interface CertificateListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

interface CertificateListResponse {
  items?: Certificate[];
  data?: Certificate[];
  total?: number;
}

export const portalCertificatesApi = {
  list: (params: CertificateListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 25));
    if (params.q) query.set("q", params.q);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    return apiGet<CertificateListResponse>(`certificates?${query.toString()}`);
  },

  getById: (id: string) => apiGet<Certificate>(`certificates/${id}`),
};
