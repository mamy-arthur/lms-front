import { useTenantStore } from '@/shared/stores/tenant.store';
import { useAuthStore } from '@/shared/stores/auth.store';
import { SIMULATION_IDS, SIMULATION_IMAGE } from '@/shared/simulation/fixtures';
import type { Tenant } from '@/shared/types/tenant.types';

// Stable display projection only; hostname/tenant resolution keeps its real identity.
const SIMULATION_TENANT: Tenant = {
  id: SIMULATION_IDS.tenant,
  slug: 'demonstration',
  name: 'Organisation démonstration',
  domain: 'demonstration.example.test',
  status: 'active',
  is_active: true,
  branding: {
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    logo_url: SIMULATION_IMAGE,
    favicon_url: SIMULATION_IMAGE,
    fontFamily: 'Inter',
  },
  features: { certificates: true, liveSession: false, customDomain: false },
};

export function useTenant() {
  const realTenant = useTenantStore((s) => s.tenant);
  const realResolutionStatus = useTenantStore((s) => s.resolutionStatus);
  const simulatedRole = useAuthStore((s) => s.simulatedRole);
  const tenant = simulatedRole ? SIMULATION_TENANT : realTenant;
  const resolutionStatus = simulatedRole ? 'resolved' : realResolutionStatus;

  return {
    tenant,
    branding: tenant?.branding,
    features: tenant?.features,
    tenantName: tenant?.name ?? 'Learneo',
    logoUrl: tenant?.branding?.logo_url ?? '/logo-default.svg',
    // true si on est sur le domaine central (aucun sous-domaine)
    isCentralMode: resolutionStatus === 'resolved' && tenant === null,
    isResolved: resolutionStatus === 'resolved',
    isLoading: resolutionStatus === 'idle' || resolutionStatus === 'loading',
  };
}
