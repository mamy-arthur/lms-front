"use client";

import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { ModuleSearch } from "@modules/shared/components/modules";
import { useModulesQuery } from "../hooks/useModulesQuery";
import type { Module } from "../types";
import { ModulesTable } from "./_components/modules-table";

export function ModuleTenantList() {
  const ctrl = useModuleListController<Module>({ defaultPageSize: 12 });
  const { data: queryResult } = useModulesQuery(ctrl.params);

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
        </div>

        <ModulesTable
          modules={queryResult?.data ?? []}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={queryResult?.total ?? 0}
          sort={ctrl.sort}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
        />
      </div>
    </div>
  );
}
