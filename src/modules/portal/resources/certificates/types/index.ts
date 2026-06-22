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
  is_active?: boolean;
  is_default_template?: boolean;
  body?: string;
  tenant_id: string;
}

export interface UpdateCertificatePayload {
  name?: string;
  is_active?: boolean;
  is_default_template?: boolean;
  body?: string;
  tenant_id?: string;
}

export interface CertificateSearchParams {
  q?: string;
  tenant_id?: string;
  status?: "active" | "inactive";
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export function normalizeCertificate(
  raw: Record<string, unknown>,
): Certificate {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? false),
    isDefaultTemplate: Boolean(
      raw.isDefaultTemplate ?? raw.is_default_template ?? false,
    ),
    body: String(raw.body ?? ""),
    tenantId: String(raw.tenantId ?? raw.tenant_id ?? ""),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  };
}
