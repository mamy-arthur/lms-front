export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
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
  status: "active" | "suspended" | "pending";
  is_active: boolean;
  branding?: TenantBranding;
  features: TenantFeatures;
}
