"use client";

import { UsersFilter } from "@modules/shared/components/users";

const ROLE_OPTIONS = [
  { value: "CLIENT_MANAGER", label: "Responsable" },
  { value: "TRAINEE", label: "Stagiaire" },
] as const;

export { ROLE_OPTIONS as TENANT_ROLE_OPTIONS };

interface TenantUsersFilterProps {
  roleFilter: string;
  statusFilter: string;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearch: () => void;
}

export function TenantUsersFilter(props: TenantUsersFilterProps) {
  return <UsersFilter {...props} roleOptions={ROLE_OPTIONS} />;
}
