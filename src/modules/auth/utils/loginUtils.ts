import { authApi } from "@/shared/api/auth.api";
import { Role } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import type { AuthUser } from "@/shared/types/auth.types";

/**
 * Login via the tenant endpoint (POST /auth/login).
 * Used by /login — accepts all roles, no platform fallback.
 */
export async function resolveLogin(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  return authApi.login(email, password);
}

/**
 * Returns the post-login redirect path based on role and tenant context.
 *
 * | Role           | Tenant | Redirect          |
 * |----------------|--------|-------------------|
 * | SUPER_ADMIN    | any    | /dashboard        |
 * | EDITOR         | yes    | /dashboard        |
 * | EDITOR         | no     | /tenant-not-found |
 * | CLIENT_MANAGER | yes    | /dashboard        |
 * | CLIENT_MANAGER | no     | /tenant-not-found |
 * | TRAINEE        | yes    | /dashboard        |
 * | TRAINEE        | no     | /tenant-not-found |
 */
export function resolveRedirectPath(
  user: AuthUser,
  hasTenant: boolean,
): string {
  switch (user.role) {
    case Role.SUPER_ADMIN:
      return ROUTES.portal.dashboard; // Can access portal without tenant
    case Role.EDITOR:
      return hasTenant ? ROUTES.portal.dashboard : ROUTES.tenantNotFound;
    case Role.CLIENT_MANAGER:
    case Role.TRAINEE:
      return hasTenant ? ROUTES.portal.dashboard : ROUTES.tenantNotFound;
    default:
      return ROUTES.auth.login;
  }
}
