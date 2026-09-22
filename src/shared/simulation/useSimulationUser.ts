import { useMemo } from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { SIMULATION_IDS } from './fixtures';
import { SIMULATION_ROLE_LABELS } from './simulation.store';

/** UI identity only. Authentication always uses auth.store.user, never this projection. */
export function useSimulationUser() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.simulatedRole);
  return useMemo(
    () =>
      role
        ? {
            id:
              role === Role.EDITOR
                ? SIMULATION_IDS.editor
                : role === Role.CLIENT_MANAGER
                  ? SIMULATION_IDS.manager
                  : SIMULATION_IDS.learner,
            role,
            name: `${SIMULATION_ROLE_LABELS[role]} démonstration`,
            email: 'demonstration@example.test',
            avatar: null,
          }
        : user,
    [role, user],
  );
}
