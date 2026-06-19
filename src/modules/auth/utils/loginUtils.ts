import { authApi } from "@/shared/api/auth.api";
import { PLATFORM_ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/constants/routes";
import type { AuthUser } from "@/shared/types/auth.types";

/**
 * Login via the tenant endpoint (POST /auth/login).
 * Used by /login — accepts all roles, no platform fallback.
 */
export async function resolveLogin(
  email: string,
  password: string,
): Promise<{ user: AuthUser }> {
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
export function resolveRedirectPath(
  user: AuthUser,
  hasTenant: boolean,
): string {
  if (PLATFORM_ROLES.includes(user.role)) return ROUTES.admin.root;
  return hasTenant ? ROUTES.portal.dashboard : ROUTES.tenantNotFound;
}
