import { Tenant } from '@/shared/types/tenant.types';
export type { Tenant };

type Branding = {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontFamily?: string;
};

type Features = {
  certificates?: boolean;
  liveSession?: boolean;
  customDomain?: boolean;
};

export function normalizeTenant(raw: Record<string, unknown>): Tenant {
  const branding = raw.branding as Branding | undefined;
  const features = raw.features as Features | undefined;
  return {
    id: String(raw.id ?? raw._id ?? ''),
    slug: String(raw.slug ?? ''),
    name: String(raw.name ?? ''),
    domain: String(raw.domain ?? ''),
    status: (raw.status as Tenant['status']) ?? 'active',
    is_active: Boolean(raw.is_active ?? raw.isActive ?? true),
    branding: {
      primary_color: String(branding?.primaryColor ?? '#2563eb'),
      secondary_color: String(branding?.secondaryColor ?? '#64748b'),
      logo_url: String(branding?.logoUrl ?? ''),
      favicon_url: String(branding?.faviconUrl ?? ''),
      fontFamily: String(branding?.fontFamily ?? 'Inter'),
    },
    features: {
      certificates: features?.certificates ?? true,
      liveSession: features?.liveSession ?? false,
      customDomain: features?.customDomain ?? false,
    },
  };
}
