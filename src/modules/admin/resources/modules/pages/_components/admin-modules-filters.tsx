"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModulesFilters } from "@/shared/components/modules";
import type { Tenant } from "@/shared/types/tenant.types";

interface AdminModulesFiltersProps {
  search: string;
  categoryFilter: string;
  tenantFilter: string;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminModulesFilters({
  search,
  categoryFilter,
  tenantFilter,
  onSearchChange,
  onCategoryFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminModulesFiltersProps) {
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
    <ModulesFilters
      search={search}
      categoryFilter={categoryFilter}
      onSearchChange={onSearchChange}
      onCategoryFilterChange={onCategoryFilterChange}
      onSearch={onSearch}
      extraFields={tenantField}
    />
  );
}
