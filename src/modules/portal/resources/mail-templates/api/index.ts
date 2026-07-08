import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/lib/apiClient';
import type { MailTemplate, CreateMailTemplatePayload, UpdateMailTemplatePayload } from '../types';

interface MailTemplateListResponse {
  data?: Record<string, unknown>[];
  total?: number;
}

export const portalMailTemplatesApi = {
  list: (params?: Record<string, unknown>) =>
    apiGet<MailTemplateListResponse>('template-mails', params),

  getById: (id: string) => apiGet<MailTemplate>(`template-mails/${id}`),

  create: (data: CreateMailTemplatePayload) =>
    apiPost<{ data: MailTemplate }>('template-mails', data),

  update: (id: string, data: UpdateMailTemplatePayload) =>
    apiPatch<{ data: MailTemplate }>(`template-mails/${id}`, data),

  remove: (id: string) => apiDelete(`template-mails/${id}`),

  duplicate: (id: string) =>
    apiPost<{ data: Record<string, unknown> }>(`template-mails/${id}/duplicate`),
};
