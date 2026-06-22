"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { ModuleSearch, CATEGORY_OPTIONS } from "@modules/shared/components/modules";
import { ModuleFormDrawer } from "../components/ModuleFormDrawer";
import { MODULES_QUERY_KEY, useModulesQuery } from "../hooks/useModulesQuery";
import { ModuleCategoryProvider } from "../lib/module-store";
import type { Module } from "../types";
import { ModulesTable } from "./_components/modules-table";

function ModuleTenantListInner() {
  const ctrl = useModuleListController<Module>({ defaultPageSize: 12 });
  const queryClient = useQueryClient();
  const { data: queryResult } = useModulesQuery(ctrl.params);

  const usedCategoryIds = useMemo(
    () => new Set(queryResult?.data.map((m) => m.category) ?? []),
    [queryResult],
  );

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
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et gérez vos modules.
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
          <div className="space-y-1">
            <Select value={ctrl.draftCategory} onValueChange={ctrl.setDraftCategory}>
              <SelectTrigger aria-label="Filtrer par catégorie" className="w-44">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
          >
            <Plus className="size-4" />
            Nouveau
          </Button>
        </div>
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
        onEdit={ctrl.handleEdit}
        onDelete={() => {}}
        onCategoryChange={handleCategoryChange}
      />

      <ModuleFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        module={ctrl.editingModule}
        usedCategoryIds={usedCategoryIds}
      />
      </div>
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
