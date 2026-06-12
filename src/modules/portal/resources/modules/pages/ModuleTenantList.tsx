"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { ModuleFormDrawer } from "../components/ModuleFormDrawer";
import { useModulesQuery, MODULES_QUERY_KEY } from "../hooks/useModulesQuery";
import { ModuleCategoryProvider } from "../lib/module-store";
import type { Module } from "../types";
import { ModulesFilters } from "./_components/modules-filters";
import { ModulesTable, type SortConfig } from "./_components/modules-table";

function ModuleTenantListInner() {
  const ctrl = useModuleListController<Module>({ defaultPageSize: 12 });
  const queryClient = useQueryClient();
  const { data: queryResult } = useModulesQuery(ctrl.params);

  const handleCategoryChange = useCallback(
    (moduleId: string, newCategory: string) => {
      queryClient.setQueriesData<{ data: Module[]; total: number }>(
        { queryKey: MODULES_QUERY_KEY },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data.map((m) =>
              m.id === moduleId ? { ...m, category: newCategory } : m,
            ),
          };
        },
      );
    },
    [queryClient],
  );

  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Gestion des modules</h1>
        <Button
          onClick={ctrl.handleOpenCreate}
          size="lg"
          className="bg-(--color-primary) text-primary-foreground"
        >
          <Plus className="size-4" />
          Ajouter un module
        </Button>
      </div>

      <ModulesFilters
        search={ctrl.draftSearch}
        categoryFilter={ctrl.draftCategory}
        onSearchChange={ctrl.setDraftSearch}
        onCategoryFilterChange={ctrl.setDraftCategory}
        onSearch={ctrl.handleSearch}
      />

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
        onEdit={ctrl.handleEdit}
        onCategoryChange={handleCategoryChange}
      />

      <ModuleFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        module={ctrl.editingModule}
      />
    </div>
  );
}

export function ModuleTenantList() {
  return (
    <ModuleCategoryProvider>
      <ModuleTenantListInner />
    </ModuleCategoryProvider>
  );
}
