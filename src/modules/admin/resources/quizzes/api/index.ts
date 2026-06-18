import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/lib/apiClient";
import type { CreateQuizPayload, Quiz } from "../types";

interface QuizListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  formation_id?: string;
  tenant_id?: string;
}

interface QuizListResponse {
  items?: Quiz[];
  data?: Quiz[];
  total?: number;
}

export const adminQuizzesApi = {
  list: (params: QuizListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 25));
    if (params.q) query.set("q", params.q);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.formation_id) query.set("formation_id", params.formation_id);
    if (params.tenant_id) query.set("tenant_id", params.tenant_id);
    return apiGet<QuizListResponse>(`admin/quizzes?${query.toString()}`);
  },

  getById: (id: string) => apiGet<Quiz>(`admin/quizzes/${id}`),

  create: (data: CreateQuizPayload) =>
    apiPost<{ data: Quiz }>("admin/quizzes", data),

  update: (id: string, data: Partial<CreateQuizPayload>) =>
    apiPut<{ data: Quiz }>(`admin/quizzes/${id}`, data),

  remove: (id: string) => apiDelete(`admin/quizzes/${id}`),
};
