import { useTenantStore } from "@/shared/stores/tenant.store";

export function useTenant() {
  const tenant = useTenantStore((s) => s.tenant);

  return {
    tenant,
    branding: tenant?.branding,
    features: tenant?.features,
    tenantName: tenant?.name ?? "",
    logoUrl: tenant?.branding?.logoUrl ?? "/logo-default.svg",
  };
}
