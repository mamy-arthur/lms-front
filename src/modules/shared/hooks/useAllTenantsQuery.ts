import { useQuery } from "@tanstack/react-query";
import { MOCK_TENANTS as RAW_MOCK_TENANTS } from "@/shared/mocks/tenant/mock-tenants";
import type { Tenant } from "@/shared/types/tenant.types";

const MOCK_TENANTS: Tenant[] = RAW_MOCK_TENANTS.map((t) => ({
  id: String(t.id),
  slug: t.subdomain,
  name: t.name,
  domain: `${t.subdomain}.learneo.io`,
  status: t.status === "trial" ? "active" : t.status,
  is_active: t.status === "active",
  branding: {
    primaryColor: t.avatarTextColor,
    secondaryColor: "#64748b",
    logoUrl: "",
    faviconUrl: "",
    fontFamily: "Inter",
  },
  features: {
    certificates: true,
    liveSession: false,
    customDomain: false,
  },
}));

export const ALL_TENANTS_QUERY_KEY = ["admin", "all-tenants"] as const;

export function useAllTenantsQuery() {
  return useQuery({
    queryKey: ALL_TENANTS_QUERY_KEY,
    queryFn: () => ({
      data: MOCK_TENANTS,
      total: MOCK_TENANTS.length,
    }),
    initialData: { data: MOCK_TENANTS, total: MOCK_TENANTS.length },
    staleTime: Infinity,
  });
}
