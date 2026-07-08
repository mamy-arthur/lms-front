import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import type { MailTemplate, CreateMailTemplatePayload, UpdateMailTemplatePayload } from '../types';

interface MailTemplateListResponse {
  data?: Record<string, unknown>[];
  total?: number;
}

export const adminMailTemplatesApi = {
  list: (params?: Record<string, unknown>) =>
    apiGet<MailTemplateListResponse>('platform/template-mails', params),

  getById: (id: string) => apiGet<MailTemplate>(`platform/template-mails/${id}`),

  create: (data: CreateMailTemplatePayload) =>
    apiPost<{ data: MailTemplate }>('platform/template-mails', data),

  update: (id: string, data: UpdateMailTemplatePayload) =>
    apiPatch<{ data: MailTemplate }>(`platform/template-mails/${id}`, data),

  remove: (id: string) => apiDelete(`platform/template-mails/${id}`),

  duplicate: (id: string) =>
    apiPost<{ data: Record<string, unknown> }>(`platform/template-mails/${id}/duplicate`),
};
