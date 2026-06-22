"use client";

import { AdminFilterPopover } from "@/modules/admin/resources/shared/AdminFilterPopover";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import type { Tenant } from "@/shared/types/tenant.types";

interface AdminQuizzesFilterProps {
  formationFilter: string;
  tenantFilter: string;
  onFormationFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminQuizzesFilter({
  formationFilter,
  tenantFilter,
  onFormationFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminQuizzesFilterProps) {
  return (
    <AdminFilterPopover
      firstFilterLabel="Formation"
      firstFilterOptions={MOCK_COURSES.map((c) => ({ value: c.id, label: c.fullName }))}
      firstFilterValue={formationFilter}
      onFirstFilterChange={onFormationFilterChange}
      tenants={tenants}
      tenantFilterValue={tenantFilter}
      onTenantFilterChange={onTenantFilterChange}
      onSearch={onSearch}
    />
  );
}
