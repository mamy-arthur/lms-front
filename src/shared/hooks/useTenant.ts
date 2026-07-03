import { useTenantStore } from '@/shared/stores/tenant.store';

export function useTenant() {
  const tenant = useTenantStore((s) => s.tenant);
  const resolutionStatus = useTenantStore((s) => s.resolutionStatus);

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
