import { authApi, type LoginOutcome } from '@/shared/api/auth.api';
import { PLATFORM_ROLES } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import type { AuthUser } from '@/shared/types/auth.types';
import { queryClient } from '@/shared/lib/query-client';

/**
 * Login via the tenant endpoint (POST /auth/login).
 * Used by /login — accepts all roles, no platform fallback.
 */
export async function resolveLogin(email: string, password: string): Promise<LoginOutcome> {
  return authApi.login(email, password);
}

/**
 * Returns the post-login redirect path based on the user's role and tenant context.
 *
 * | Role                      | hasTenant | Redirect          |
 * |---------------------------|-----------|-------------------|
 * | SUPER_ADMIN / EDITOR      | any       | /admin            |
 * | others                    | true      | /dashboard        |
 * | others                    | false     | /tenant-not-found |
 */
export function resolveRedirectPath(user: AuthUser, hasTenant: boolean): string {
  if (PLATFORM_ROLES.includes(user.role)) return ROUTES.admin.root;
  return hasTenant ? ROUTES.portal.dashboard : ROUTES.tenantNotFound;
}

/**
 * Removes all user-scoped query cache entries synchronously.
 *
 * Must be called BEFORE setAuth() so that auth-triggered re-renders cannot
 * observe stale data from the previous user's session.
 *
 * Tenant queries (queryKey[0] === 'tenant') are preserved: they are resolved
 * from the hostname, not the logged-in user, and are shared across all users
 * of the same subdomain.
 */
export function clearSessionCache(): void {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== 'tenant',
  });
}
