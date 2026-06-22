"use client";

import { useMemo } from "react";
import { ModuleSearch } from "@modules/shared/components/modules";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { useModulesQuery } from "../hooks/useModulesQuery";
import type { Module } from "../types";
import { AdminModulesFilter } from "./_components/admin-modules-filter";
import { AdminModulesTable } from "./_components/admin-modules-table";

export function ModuleList() {
  const ctrl = useModuleListController<Module>({
    includeTenantFilter: true,
    defaultPageSize: 25,
  });
  const { data: tenantsData } = useAllTenantsQuery();
  const tenants = tenantsData?.data ?? [];
  const { data, isLoading } = useModulesQuery(ctrl.params);

  const tenantNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tenants) {
      map[String(t.id)] = t.name;
    }
    return map;
  }, [tenants]);

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez les modules de vos formations.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ModuleSearch
            value={ctrl.draftSearch}
            onChange={ctrl.setDraftSearch}
            onSearch={ctrl.handleSearch}
          />
          <div className="flex items-center gap-2 sm:ml-auto">
            <AdminModulesFilter
              categoryFilter={ctrl.draftCategory}
              tenantFilter={ctrl.draftTenant}
              onCategoryFilterChange={ctrl.setDraftCategory}
              onTenantFilterChange={ctrl.setDraftTenant}
              onSearch={ctrl.handleSearch}
              tenants={tenants}
            />
          </div>
        </div>

        <AdminModulesTable
          modules={data?.data ?? []}
          isLoading={isLoading}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={data?.total ?? 0}
          sort={ctrl.sort}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
          tenantNames={tenantNames}
        />
      </div>
    </div>
  );
}
