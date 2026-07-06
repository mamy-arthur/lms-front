export interface TenantBranding {
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
  fontFamily: string;
}

export interface TenantFeatures {
  certificates: boolean;
  liveSession: boolean;
  customDomain: boolean;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'pending';
  is_active: boolean;
  branding?: TenantBranding;
  features: TenantFeatures;
}
