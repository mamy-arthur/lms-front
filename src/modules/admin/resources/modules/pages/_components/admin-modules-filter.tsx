"use client";

import { CATEGORY_OPTIONS } from "@modules/shared/components/modules/constants/modules";
import { AdminFilterPopover } from "@/modules/admin/resources/shared/AdminFilterPopover";
import type { Tenant } from "@/shared/types/tenant.types";

interface AdminModulesFilterProps {
  categoryFilter: string;
  tenantFilter: string;
  onCategoryFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminModulesFilter({
  categoryFilter,
  tenantFilter,
  onCategoryFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminModulesFilterProps) {
  return (
    <AdminFilterPopover
      firstFilterLabel="Catégorie"
      firstFilterOptions={[...CATEGORY_OPTIONS]}
      firstFilterValue={categoryFilter}
      onFirstFilterChange={onCategoryFilterChange}
      tenants={tenants}
      tenantFilterValue={tenantFilter}
      onTenantFilterChange={onTenantFilterChange}
      onSearch={onSearch}
    />
  );
}
