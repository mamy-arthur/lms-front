"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { useModulesQuery } from "../hooks/useModulesQuery";
import type { Module } from "../types";
import { AdminModuleFormDrawer } from "./_components/admin-module-form-drawer";
import { AdminModulesFilters } from "./_components/admin-modules-filters";
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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez vos modules ici.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
          >
            <Plus className="mr-1 size-4" />
            Nouveau module
          </Button>
        </div>
      </header>
      <AdminModulesFilters
        search={ctrl.draftSearch}
        categoryFilter={ctrl.draftCategory}
        tenantFilter={ctrl.draftTenant}
        onSearchChange={ctrl.setDraftSearch}
        onCategoryFilterChange={ctrl.setDraftCategory}
        onTenantFilterChange={ctrl.setDraftTenant}
        onSearch={ctrl.handleSearch}
        tenants={tenants}
      />

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
        onEdit={ctrl.handleEdit}
        onDelete={() => {}}
        tenantNames={tenantNames}
      />

      <AdminModuleFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        module={ctrl.editingModule}
        tenants={tenants}
      />
    </div>
  );
}
