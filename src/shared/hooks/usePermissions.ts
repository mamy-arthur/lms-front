import { useAuthStore } from "@/shared/stores/auth.store";
import { canAccess, AccessRule, PermissionSet } from "@/shared/auth/permissions";
import { Role } from "@/shared/constants/roles";

export function usePermissions() {
  const role = useAuthStore((s) => s.role);
  const isSuperAdmin = role === Role.SUPER_ADMIN;

  const permissions: PermissionSet | null = role
    ? { role, isSuperAdmin }
    : null;

  const can = (rule: AccessRule): boolean => canAccess(permissions, rule);

  return { permissions, can };
}
