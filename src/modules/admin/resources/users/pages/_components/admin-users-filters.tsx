"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsersFilters } from "@/shared/components/users";
import type { Tenant } from "@/shared/types/tenant.types";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "EDITOR", label: "Éditeur" },
  { value: "CLIENT_MANAGER", label: "Responsable" },
  { value: "TRAINEE", label: "Stagiaire" },
] as const;

interface AdminUsersFiltersProps {
  search: string;
  roleFilter: string;
  statusFilter: string;
  tenantFilter: string;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminUsersFilters({
  search,
  roleFilter,
  statusFilter,
  tenantFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminUsersFiltersProps) {
  const tenantField = (
    <div className="flex-1 space-y-1">
      <Label className="text-xs text-muted-foreground">Tenant</Label>
      <Select value={tenantFilter} onValueChange={onTenantFilterChange}>
        <SelectTrigger aria-label="Filtrer par tenant" className="w-full">
          <SelectValue placeholder="Tous les tenants" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <UsersFilters
      search={search}
      roleFilter={roleFilter}
      statusFilter={statusFilter}
      onSearchChange={onSearchChange}
      onRoleFilterChange={onRoleFilterChange}
      onStatusFilterChange={onStatusFilterChange}
      onSearch={onSearch}
      roleOptions={ROLE_OPTIONS}
      extraFields={tenantField}
    />
  );
}
