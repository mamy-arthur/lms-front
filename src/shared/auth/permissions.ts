import { Role } from '@/shared/constants/roles';

export interface AccessRule {
  anyRoles?: Role[];
  superAdminOnly?: boolean;
}

export interface PermissionSet {
  role: Role;
  isSuperAdmin: boolean;
}

export function canAccess(permissions: PermissionSet | null, rule?: AccessRule): boolean {
  if (!permissions) return false;
  if (!rule) return true;

  if (rule.superAdminOnly) {
    return permissions.isSuperAdmin;
  }

  if (rule.anyRoles) {
    return rule.anyRoles.includes(permissions.role);
  }

  return true;
}

export const ACCESS = {
  users: { anyRoles: [Role.SUPER_ADMIN, Role.CLIENT_MANAGER, Role.EDITOR] },
  courses: { anyRoles: [Role.EDITOR] },
  quizzes: { anyRoles: [Role.EDITOR] },
  modules: { anyRoles: [Role.EDITOR] },
  trainees: { anyRoles: [Role.CLIENT_MANAGER] },
  reports: { anyRoles: [Role.CLIENT_MANAGER] },
  store: { anyRoles: [Role.CLIENT_MANAGER, Role.EDITOR] },
  tenants: { superAdminOnly: true },
  templates: { anyRoles: [Role.EDITOR, Role.SUPER_ADMIN, Role.CLIENT_MANAGER] },
  contentTypes: { superAdminOnly: true },
} as const satisfies Record<string, AccessRule>;
