import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import type { Tenant } from '@/shared/types/tenant.types';

export const evaluationUser = {
  id: 'learner-a',
  name: 'Learner',
  email: 'learner@example.test',
  role: Role.TRAINEE,
};

export const evaluationTenant: Tenant = {
  id: 'tenant-a',
  slug: 'tenant-a',
  name: 'Tenant A',
  domain: 'tenant-a.example.test',
  status: 'active',
  is_active: true,
  features: { certificates: false, liveSession: false, customDomain: false },
};

export function resetEvaluationIdentity() {
  useAuthStore.setState(useAuthStore.getInitialState());
  useAuthStore.getState().setAuth(evaluationUser, 'session-a');
  useTenantStore.setState(useTenantStore.getInitialState());
  useTenantStore.getState().setTenant(evaluationTenant);
  useSimulationStore.setState(useSimulationStore.getInitialState());
}
