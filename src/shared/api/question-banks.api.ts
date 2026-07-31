import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/shared/lib/apiClient';
import type {
  ApiQuestionBank,
  ApiQuizItem,
  CreateQuestionBankPayload,
  CreateQuizItemPayload,
  UpdateQuestionBankPayload,
  UpdateQuizItemPayload,
} from '@/shared/types/question-bank.types';

export const questionBanksApi = {
  list: (params?: { learning_path_id?: string }) =>
    apiGet<{ data: ApiQuestionBank[] }>(
      'platform/question-banks',
      params as Record<string, unknown>,
    ),

  getById: (id: string) => apiGet<ApiQuestionBank>(`platform/question-banks/${id}`),

  create: (data: CreateQuestionBankPayload) =>
    apiPost<ApiQuestionBank>('platform/question-banks', data),

  update: (id: string, data: UpdateQuestionBankPayload) =>
    apiPut<ApiQuestionBank>(`platform/question-banks/${id}`, data),

  deactivate: (id: string) => apiPatch<ApiQuestionBank>(`platform/question-banks/${id}/deactivate`),

  listQuizzes: (questionBankId: string, params?: { type?: string }) =>
    apiGet<{ data: ApiQuizItem[] }>(
      `platform/question-banks/${questionBankId}/quizzes`,
      params as Record<string, unknown>,
    ),

  createQuizItem: (questionBankId: string, data: CreateQuizItemPayload) =>
    apiPost<ApiQuizItem>(`platform/question-banks/${questionBankId}/quizzes`, data),
};

export const quizItemsApi = {
  getById: (id: string) => apiGet<ApiQuizItem>(`platform/quizzes/${id}`),

  update: (id: string, data: UpdateQuizItemPayload) =>
    apiPut<ApiQuizItem>(`platform/quizzes/${id}`, data),

  delete: (id: string) => apiDelete(`platform/quizzes/${id}`),
};
