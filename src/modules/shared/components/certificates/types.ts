export interface Certificate {
  id: string;
  name: string;
  isActive: boolean;
  isDefaultTemplate: boolean;
  body: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificatePayload {
  name: string;
  status: boolean;
  setasdefault: boolean;
  body: string;
  tenant_id: string;
}

export interface UpdateCertificatePayload {
  name?: string;
  status?: boolean;
  setasdefault?: boolean;
  body?: string;
  tenant_id?: string;
}

export interface PreviewCertificatePayload {
  resolve_variables?: boolean;
  user_id?: string | null;
  course_id?: string | null;
}

export interface CertificateSearchParams {
  q?: string;
  tenant_id?: string;
  status?: 'active' | 'inactive';
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export function normalizeCertificate(raw: Record<string, unknown>): Certificate {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    name: String(raw.name ?? ''),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? raw.status ?? false),
    isDefaultTemplate: Boolean(
      raw.isDefaultTemplate ?? raw.is_default_template ?? raw.setasdefault ?? false,
    ),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ''),
    body: String(raw.body ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  };
}
