import { Tenant } from "@/shared/types/tenant.types";
export type { Tenant };

export function normalizeTenant(raw: Record<string, unknown>): Tenant {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    slug: String(raw.slug ?? ""),
    name: String(raw.name ?? ""),
    domain: String(raw.domain ?? ""),
    status: (raw.status as Tenant["status"]) ?? "active",
    is_active: Boolean(raw.is_active ?? raw.isActive ?? true),
    branding: {
      primaryColor: String((raw.branding as any)?.primaryColor ?? "#2563eb"),
      secondaryColor: String((raw.branding as any)?.secondaryColor ?? "#64748b"),
      logoUrl: String((raw.branding as any)?.logoUrl ?? ""),
      faviconUrl: String((raw.branding as any)?.faviconUrl ?? ""),
      fontFamily: String((raw.branding as any)?.fontFamily ?? "Inter"),
    },
    features: {
      certificates: Boolean((raw.features as any)?.certificates ?? true),
      liveSession: Boolean((raw.features as any)?.liveSession ?? false),
      customDomain: Boolean((raw.features as any)?.customDomain ?? false),
    },
  };
}
