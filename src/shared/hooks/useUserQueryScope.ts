'use client';

import type { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';

/** Cache isolation only: the API remains responsible for authorization. */
export function useUserQueryScope(namespace: string, allowedRoles: readonly Role[]) {
  const tenantId = useTenantStore((state) => state.tenant?.id);
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.role);
  const sessionId = useAuthStore((state) => state.sessionId);
  return {
    key: [namespace, tenantId ?? 'user-tenant', userId, role, sessionId] as const,
    enabled: Boolean(userId) && role !== null && allowedRoles.includes(role),
  };
}
