import { ACCESS, AccessRule } from "@/shared/auth/permissions";

const RESOURCE_ACCESS: Record<string, AccessRule | undefined> = {
  users:    ACCESS.users,
  courses:  ACCESS.courses,
  trainees: ACCESS.trainees,
  tenants:  ACCESS.tenants,
  reports:  ACCESS.reports,
};

export function getResourceAccess(resource: string): AccessRule | undefined {
  return RESOURCE_ACCESS[resource];
}
