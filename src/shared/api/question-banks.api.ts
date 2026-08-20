import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/shared/lib/apiClient';
import type {
  ApiQuestionBank,
  ApiQuizItem,
  CreateQuestionBankPayload,
  CreateQuizItemPayload,
  UpdateQuestionBankPayload,
  UpdateQuizItemPayload,
} from '@/shared/types/question-bank.types';

export interface QuestionBankListParams {
  learning_path_id?: string;
  competency_id?: string;
  q?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface QuizListParams {
  type?: string;
  q?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export const questionBanksApi = {
  list: (params?: QuestionBankListParams) => {
    const p: Record<string, unknown> = {};
    if (params?.learning_path_id) p.learning_path_id = params.learning_path_id;
    if (params?.competency_id) p.competency_id = params.competency_id;
    if (params?.page !== undefined) p.page = params.page;
    if (params?.per_page !== undefined) p.per_page = params.per_page;
    if (params?.q) p.q = params.q;
    if (params?.sort_by) p.sort_by = params.sort_by;
    if (params?.sort_order) p.sort_order = params.sort_order;
    const hasParams = Object.keys(p).length > 0;
    return apiGet<{
      data: ApiQuestionBank[];
      meta?: { total?: number; current_page?: number; per_page?: number };
    }>('platform/question-banks', hasParams ? p : undefined);
  },

  getById: (id: string) => apiGet<ApiQuestionBank>(`platform/question-banks/${id}`),

  create: (data: CreateQuestionBankPayload) =>
    apiPost<ApiQuestionBank>('platform/question-banks', data),

  update: (id: string, data: UpdateQuestionBankPayload) =>
    apiPut<ApiQuestionBank>(`platform/question-banks/${id}`, data),

  deactivate: (id: string) => apiPatch<ApiQuestionBank>(`platform/question-banks/${id}/deactivate`),

  listQuizzes: (questionBankId: string, params?: QuizListParams) => {
    const p: Record<string, unknown> = {};
    if (params?.type) p.type = params.type;
    if (params?.q) p.q = params.q;
    if (params?.sort_by) p.sort_by = params.sort_by;
    if (params?.sort_order) p.sort_order = params.sort_order;
    if (params?.page !== undefined) p.page = params.page;
    if (params?.per_page !== undefined) p.per_page = params.per_page;
    return apiGet<{
      data: ApiQuizItem[];
      meta?: { total?: number; current_page?: number; per_page?: number };
    }>(
      `platform/question-banks/${questionBankId}/quizzes`,
      Object.keys(p).length > 0 ? p : undefined,
    );
  },

  createQuizItem: (questionBankId: string, data: CreateQuizItemPayload) =>
    apiPost<ApiQuizItem>(`platform/question-banks/${questionBankId}/quizzes`, data),
};

export const quizItemsApi = {
  getById: (id: string) => apiGet<ApiQuizItem>(`platform/quizzes/${id}`),

  update: (id: string, data: UpdateQuizItemPayload) =>
    apiPut<ApiQuizItem>(`platform/quizzes/${id}`, data),

  delete: (id: string) => apiDelete(`platform/quizzes/${id}`),
};
