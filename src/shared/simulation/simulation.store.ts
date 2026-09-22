import { create } from 'zustand';
import { Role } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';

export interface SimulationSession {
  allowed_roles: Role[];
  simulated_role: Role | null;
  tenant_id: string | null;
  shop_tenants: Array<{ id: string; name: string }>;
}

interface SimulationState {
  phase: 'idle' | 'checking' | 'ready' | 'transition' | 'error';
  session: SimulationSession | null;
  returnPath: string | null;
  epoch: number;
  error: string | null;
}

// Server-authorized state only; no localStorage flag can grant a simulated role.
export const useSimulationStore = create<SimulationState>(() => ({
  phase: 'idle',
  session: null,
  returnPath: null,
  epoch: 0,
  error: null,
}));

export const SIMULATION_ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super admin',
  [Role.EDITOR]: 'Éditeur',
  [Role.CLIENT_MANAGER]: 'Client',
  [Role.TRAINEE]: 'Stagiaire',
};

/** Same landing page as a real login of that role (see resolveRedirectPath). */
export function roleHome(role: Role | null): string {
  if (role === Role.EDITOR || role === Role.SUPER_ADMIN) return ROUTES.admin.root;
  return role === Role.TRAINEE ? ROUTES.portal.traineeFormations : ROUTES.portal.dashboard;
}
