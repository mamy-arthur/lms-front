"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuizzesFilters } from "@/shared/components/quizzes";
import type { Tenant } from "@/shared/types/tenant.types";

interface AdminQuizzesFiltersProps {
  search: string;
  formationFilter: string;
  tenantFilter: string;
  onSearchChange: (value: string) => void;
  onFormationFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminQuizzesFilters({
  search,
  formationFilter,
  tenantFilter,
  onSearchChange,
  onFormationFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminQuizzesFiltersProps) {
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
    <QuizzesFilters
      search={search}
      formationFilter={formationFilter}
      onSearchChange={onSearchChange}
      onFormationFilterChange={onFormationFilterChange}
      onSearch={onSearch}
      extraFields={tenantField}
    />
  );
}
