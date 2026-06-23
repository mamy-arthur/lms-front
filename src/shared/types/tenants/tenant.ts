export type TenantStatus = "active" | "suspended" | "inactive" | "pending";
export type TenantPlan = "starter" | "pro" | "enterprise";

export interface Tenant {
    id: number;
    name: string;
    subdomain: string;
    adminName: string;
    plan: TenantPlan;
    status: TenantStatus;
    created_at: string; // ISO date string
    initials: string;
    client_id: string;
    slug: string;
    domains: { id: string; subdomain: string; is_primary: boolean }[];
    is_active: boolean;
}

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
    primary_color?: string;
}

export interface UpdateTenantPayload {
    name?: string;
    status?: string;
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
