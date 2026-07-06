/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { Tenant } from '@/shared/types/tenant.types';

/**
 * "idle"     → résolution pas encore démarrée (état initial)
 * "loading"  → appel API en cours
 * "resolved" → tenant chargé avec succès (ou mode central sans sous-domaine)
 * "not-found"→ hostname inconnu du backend (404)
 * "inactive" → tenant trouvé mais désactivé
 */
export type TenantResolutionStatus = 'idle' | 'loading' | 'resolved' | 'not-found' | 'inactive';

interface TenantState {
  tenant: Tenant | null;
  resolutionStatus: TenantResolutionStatus;
  setTenant: (tenant: Tenant) => void;
  clearTenant: () => void;
  setResolutionStatus: (status: TenantResolutionStatus) => void;
}

export const useTenantStore = create<TenantState>((set: any) => ({
  tenant: null,
  resolutionStatus: 'idle',
  setTenant: (tenant: Tenant) => set({ tenant }),
  clearTenant: () => set({ tenant: null, resolutionStatus: 'idle' }),
  setResolutionStatus: (resolutionStatus: TenantResolutionStatus) => set({ resolutionStatus }),
}));
