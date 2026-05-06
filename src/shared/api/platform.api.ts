import { apiPost } from "@/shared/lib/apiClient";

export interface CreateTenantPayload {
  editor_name: string;
  editor_slug?: string;
  client_name: string;
  client_slug?: string;
  tenant_name: string;
  tenant_slug?: string;
  domain?: string;
  subdomain?: string;
  is_active?: boolean;
}

interface TenantDomain {
  domain: string;
  subdomain: string | null;
  is_primary: boolean;
}

export interface BackendTenant {
  id: string;
  client_id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "pending";
  is_active: boolean;
  domains: TenantDomain[];
  created_at: string;
}

export const platformApi = {
  createTenant: (payload: CreateTenantPayload) =>
    apiPost<{ data: BackendTenant }>("platform/tenants", payload),
};
