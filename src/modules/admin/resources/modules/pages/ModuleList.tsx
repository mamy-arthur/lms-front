"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ModuleSearch } from "@modules/shared/components/modules";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { useModulesQuery } from "../hooks/useModulesQuery";
import type { Module } from "../types";
import { AdminModuleFormDrawer } from "../components/AdminModuleFormDrawer";
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
            Créez, modifiez et gérez les modules de vos formations.
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
            <Button
              onClick={ctrl.handleOpenCreate}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
            >
              <Plus className="size-4" />
              Nouveau
            </Button>
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
          onEdit={ctrl.handleEdit}
        />

        <AdminModuleFormDrawer
          open={ctrl.isDrawerOpen}
          onClose={ctrl.handleCloseDrawer}
          onSuccess={ctrl.handleSuccess}
          module={ctrl.editingModule}
          tenants={tenants}
        />
      </div>
    </div>
  );
}
