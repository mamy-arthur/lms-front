import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
import type { BackendTenant } from '@/shared/types/tenants/tenant';
import type { Tenant } from '@/shared/types/tenant.types';

function normalizeTenant(raw: BackendTenant): Tenant {
  return {
    id: String(raw.id),
    slug: raw.slug,
    name: raw.name,
    domain: raw.domains?.find((d) => d.is_primary)?.domain ?? raw.slug,
    status: raw.status,
    is_active: raw.is_active,
    features: {
      certificates: true,
      liveSession: false,
      customDomain: false,
    },
  };
}

export const ALL_TENANTS_QUERY_KEY = ['admin', 'all-tenants'] as const;

export function useAllTenantsQuery() {
  return useQuery({
    queryKey: ALL_TENANTS_QUERY_KEY,
    queryFn: async (): Promise<{ data: Tenant[]; total: number }> => {
      const response = await tenantApi.getAll();
      const raw = (response.data ?? []) as unknown as BackendTenant[];
      const data = raw.map(normalizeTenant);
      return { data, total: data.length };
    },
    staleTime: 5 * 60 * 1000,
  });
}
