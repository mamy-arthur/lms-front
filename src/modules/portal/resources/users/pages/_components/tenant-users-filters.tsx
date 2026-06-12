"use client";

import { UsersFilters } from "@/shared/components/users";

const ROLE_OPTIONS = [
  { value: "CLIENT_MANAGER", label: "Responsable" },
  { value: "TRAINEE", label: "Stagiaire" },
] as const;

export { ROLE_OPTIONS as TENANT_ROLE_OPTIONS };

interface TenantUsersFiltersProps {
  search: string;
  roleFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearch: () => void;
}

export function TenantUsersFilters(props: TenantUsersFiltersProps) {
  return <UsersFilters {...props} roleOptions={ROLE_OPTIONS} />;
}
