"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { ModuleSearch } from "@modules/shared/components/modules";
import { ModuleFormDrawer } from "../components/ModuleFormDrawer";
import { MODULES_QUERY_KEY, useModulesQuery } from "../hooks/useModulesQuery";
import { ModuleCategoryProvider, useModuleCategoryStore } from "../lib/module-store";
import type { Module } from "../types";
import { cn } from "@/lib/utils";
import { ModulesTable } from "./_components/modules-table";

function ModuleTenantListInner() {
  const ctrl = useModuleListController<Module>({ defaultPageSize: 12 });
  const queryClient = useQueryClient();
  const { data: queryResult } = useModulesQuery(ctrl.params);
  const { categories: filterCategories } = useModuleCategoryStore();

  const [duplicateFrom, setDuplicateFrom] = useState<Module | undefined>();
  const [catFilterOpen, setCatFilterOpen] = useState(false);

  const selectedCategories = ctrl.draftCategory;

  const toggleCategoryFilter = (categoryId: string) => {
    const next = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((c) => c !== categoryId)
      : [...selectedCategories.filter((c) => c !== "all"), categoryId];
    ctrl.setDraftCategory(next.length > 0 ? next : ["all"]);
    ctrl.handleSearch();
  };

  const usedCategoryIds = useMemo(
    () => new Set(queryResult?.data.map((m) => m.category) ?? []),
    [queryResult],
  );

  const handleDuplicate = useCallback((module: Module) => {
    setDuplicateFrom(module);
    ctrl.handleOpenCreate();
  }, [ctrl]);

  const handleClose = useCallback(() => {
    setDuplicateFrom(undefined);
    ctrl.handleCloseDrawer();
  }, [ctrl]);

  const handleSuccess = useCallback(() => {
    setDuplicateFrom(undefined);
    ctrl.handleSuccess();
  }, [ctrl]);

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
            <Popover open={catFilterOpen} onOpenChange={setCatFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-label="Filtrer par catégorie"
                  className="h-9 w-44 justify-between font-normal text-xs"
                >
                  {selectedCategories.includes("all") || selectedCategories.length === 0
                    ? "Toutes les catégories"
                    : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? "s" : ""}`}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-0">
                <Command>
                  <CommandInput placeholder="Rechercher…" />
                  <CommandEmpty>Aucune catégorie</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        ctrl.setDraftCategory(["all"]);
                        ctrl.handleSearch();
                        setCatFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          selectedCategories.includes("all") ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Toutes les catégories
                    </CommandItem>
                    {filterCategories.map((cat) => (
                      <CommandItem
                        key={cat.id}
                        value={cat.name}
                        onSelect={() => toggleCategoryFilter(cat.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            selectedCategories.includes(cat.id) ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {cat.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
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
        onDuplicate={handleDuplicate}
        onDelete={() => {}}
        onCategoryChange={handleCategoryChange}
      />

      <ModuleFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        module={ctrl.editingModule}
        duplicateFrom={duplicateFrom}
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
