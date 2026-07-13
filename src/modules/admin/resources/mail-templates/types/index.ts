export interface MailTemplate {
  id: string;
  reference: string;
  name: string;
  subject: string;
  isActive: boolean;
  body: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMailTemplatePayload {
  name: string;
  subject: string;
  status?: boolean;
  body?: string;
}

export interface UpdateMailTemplatePayload {
  name?: string;
  subject?: string;
  status?: boolean;
  body?: string;
}

export interface MailTemplateSearchParams {
  q?: string;
  tenant_id?: string;
  status?: 'active' | 'inactive';
  category?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export function normalizeMailTemplate(raw: Record<string, unknown>): MailTemplate {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    reference: String(raw.reference ?? ''),
    name: String(raw.name ?? ''),
    subject: String(raw.subject ?? ''),
    isActive: Boolean(raw.status ?? raw.isActive ?? raw.is_active ?? false),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ''),
    body: String(raw.body ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  };
}
