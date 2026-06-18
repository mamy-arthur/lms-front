"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsersFilter } from "@modules/shared/components/users";
import type { Tenant } from "@/shared/types/tenant.types";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super admin" },
  { value: "EDITOR", label: "Éditeur" },
  { value: "CLIENT_MANAGER", label: "Responsable" },
  { value: "TRAINEE", label: "Stagiaire" },
] as const;

interface AdminUsersFilterProps {
  roleFilter: string;
  statusFilter: string;
  tenantFilter: string;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminUsersFilter({
  roleFilter,
  statusFilter,
  tenantFilter,
  onRoleFilterChange,
  onStatusFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminUsersFilterProps) {
  const tenantField = (
    <div className="space-y-1">
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
    <UsersFilter
      roleFilter={roleFilter}
      statusFilter={statusFilter}
      onRoleFilterChange={onRoleFilterChange}
      onStatusFilterChange={onStatusFilterChange}
      onSearch={onSearch}
      roleOptions={ROLE_OPTIONS}
      extraFields={tenantField}
    />
  );
}
