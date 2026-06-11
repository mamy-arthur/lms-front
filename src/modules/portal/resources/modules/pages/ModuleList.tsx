"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ModuleFormDrawer } from "../components/ModuleFormDrawer";
import { useModulesQuery, MODULES_QUERY_KEY } from "../hooks/useModulesQuery";
import { ModuleCategoryProvider } from "../lib/module-store";
import type { Module } from "../types";
import { ModulesFilters } from "./_components/modules-filters";
import { ModulesTable, type SortConfig } from "./_components/modules-table";

function useModuleListController() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>();
  const [draftSearch, setDraftSearch] = useState("");
  const [draftCategory, setDraftCategory] = useState("all");
  const [params, setParams] = useState<Record<string, unknown>>({
    sort_by: "name",
    sort_dir: "asc",
    page: 0,
    page_size: 12,
  });

  const handleSearch = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      q: draftSearch || undefined,
      category: draftCategory !== "all" ? draftCategory : undefined,
      page: 0,
    }));
  }, [draftSearch, draftCategory]);

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_dir:
        prev.sort_by === column && prev.sort_dir === "asc" ? "desc" : "asc",
      page: 0,
    }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingModule(undefined);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingModule(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingModule(undefined);
  }, []);

  const handleEdit = useCallback((mod: Module) => {
    setEditingModule(mod);
    setIsDrawerOpen(true);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => setParams((prev) => ({ ...prev, page: newPage })),
    [],
  );

  const handlePageSizeChange = useCallback((newSize: number) => {
    setParams((prev) => ({ ...prev, page_size: newSize, page: 0 }));
  }, []);

  const page = (params.page as number) ?? 0;
  const pageSize = (params.page_size as number) ?? 12;
  const sort: SortConfig = {
    column: (params.sort_by as string) ?? "name",
    direction: (params.sort_dir as "asc" | "desc") ?? "asc",
  };
  const hasQuery = !!(draftSearch || draftCategory !== "all");

  return {
    isDrawerOpen,
    editingModule,
    draftSearch,
    setDraftSearch,
    draftCategory,
    setDraftCategory,
    params,
    sort,
    handleSearch,
    handleSort,
    handleOpenCreate,
    handleCloseDrawer,
    handleSuccess,
    handleEdit,
    handlePageChange,
    handlePageSizeChange,
    page,
    pageSize,
    hasQuery,
  };
}

function ModuleListInner() {
  const ctrl = useModuleListController();
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
        isLoading={false}
        hasQuery={ctrl.hasQuery}
        page={ctrl.page}
        pageSize={ctrl.pageSize}
        total={queryResult?.total ?? 0}
        sort={ctrl.sort}
        onSort={ctrl.handleSort}
        onPageChange={ctrl.handlePageChange}
        onPageSizeChange={ctrl.handlePageSizeChange}
        onView={() => {}}
        onEdit={ctrl.handleEdit}
        onDelete={() => {}}
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

export function ModuleList() {
  return (
    <ModuleCategoryProvider>
      <ModuleListInner />
    </ModuleCategoryProvider>
  );
}
