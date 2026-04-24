import { Role } from "@/shared/constants/roles";

export interface AccessRule {
  anyRoles?: Role[];
  superAdminOnly?: boolean;
}

export interface PermissionSet {
  role: Role;
  isSuperAdmin: boolean;
}

export function canAccess(
  permissions: PermissionSet | null,
  rule?: AccessRule
): boolean {
  if (!permissions) return false;
  if (!rule) return true;
  if (permissions.isSuperAdmin) return true;
  if (rule.superAdminOnly) return false;
  if (rule.anyRoles) return rule.anyRoles.includes(permissions.role);
  return true;
}

export const ACCESS = {
  users:    { anyRoles: [Role.SUPER_ADMIN, Role.CLIENT_MANAGER] },
  courses:  { anyRoles: [Role.SUPER_ADMIN, Role.EDITOR] },
  trainees: { anyRoles: [Role.SUPER_ADMIN, Role.CLIENT_MANAGER] },
  reports:  { anyRoles: [Role.SUPER_ADMIN, Role.CLIENT_MANAGER] },
  tenants:  { superAdminOnly: true },
} as const satisfies Record<string, AccessRule>;
