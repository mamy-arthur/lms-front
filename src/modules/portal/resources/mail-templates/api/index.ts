import { apiGet } from "@/shared/lib/apiClient";
import type { MailTemplate } from "../types";

interface MailTemplateListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: "active" | "inactive";
}

interface MailTemplateListResponse {
  items?: MailTemplate[];
  data?: MailTemplate[];
  total?: number;
}

export const portalMailTemplatesApi = {
  list: (params: MailTemplateListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 25));
    if (params.q) query.set("q", params.q);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.status) query.set("status", params.status);
    return apiGet<MailTemplateListResponse>(
      `mail-templates?${query.toString()}`,
    );
  },

  getById: (id: string) => apiGet<MailTemplate>(`mail-templates/${id}`),
};
