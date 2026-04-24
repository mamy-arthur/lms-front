"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTenantStore } from "@/shared/stores/tenant.store";
import { useAuthStore } from "@/shared/stores/auth.store";
import { tenantKeys } from "@/shared/queries/keys";
import { apiGet } from "@/shared/lib/apiClient";
import type { Tenant } from "@/shared/types/tenant.types";

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const setTenant = useTenantStore((s) => s.setTenant);
  const token = useAuthStore((s) => s.token);

  const { data: tenant } = useQuery({
    queryKey: tenantKeys.current(),
    queryFn: () => apiGet<Tenant>("tenant/current"),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!token,
  });

  useEffect(() => {
    if (!tenant) return;

    setTenant(tenant);

    const root = document.documentElement;
    root.style.setProperty("--color-primary", tenant.branding.primaryColor);
    root.style.setProperty("--color-secondary", tenant.branding.secondaryColor);
    root.style.setProperty("--font-brand", tenant.branding.fontFamily);

    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (link && tenant.branding.faviconUrl) link.href = tenant.branding.faviconUrl;

    document.title = tenant.name;
  }, [tenant, setTenant]);

  return <>{children}</>;
}
