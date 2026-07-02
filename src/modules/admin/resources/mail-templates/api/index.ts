import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/lib/apiClient";
import type {
  MailTemplate,
  CreateMailTemplatePayload,
  UpdateMailTemplatePayload,
} from "../types";

interface MailTemplateListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  tenant_id?: string;
  status?: "active" | "inactive";
}

interface MailTemplateListResponse {
  items?: MailTemplate[];
  data?: MailTemplate[];
  total?: number;
}

export const adminMailTemplatesApi = {
  list: (params: MailTemplateListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 25));
    if (params.q) query.set("q", params.q);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.tenant_id) query.set("tenant_id", params.tenant_id);
    if (params.status) query.set("status", params.status);
    return apiGet<MailTemplateListResponse>(
      `admin/mail-templates?${query.toString()}`,
    );
  },

  getById: (id: string) => apiGet<MailTemplate>(`admin/mail-templates/${id}`),

  create: (data: CreateMailTemplatePayload) =>
    apiPost<{ data: MailTemplate }>("admin/mail-templates", data),

  update: (id: string, data: UpdateMailTemplatePayload) =>
    apiPut<{ data: MailTemplate }>(`admin/mail-templates/${id}`, data),

  remove: (id: string) => apiDelete(`admin/mail-templates/${id}`),
};
