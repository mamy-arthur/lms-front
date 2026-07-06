export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  EDITOR = 'EDITOR',
  CLIENT_MANAGER = 'CLIENT_MANAGER',
  TRAINEE = 'TRAINEE',
}

/** Utilisateurs de la plateforme centrale — login via POST /platform/auth/login */
export const PLATFORM_ROLES: Role[] = [Role.SUPER_ADMIN, Role.EDITOR];

/** Utilisateurs d'un tenant — login via POST /auth/login */
export const TENANT_ROLES: Role[] = [Role.CLIENT_MANAGER, Role.TRAINEE];
