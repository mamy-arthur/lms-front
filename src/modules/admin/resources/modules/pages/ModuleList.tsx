'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ModuleSearch } from '@modules/shared/components/modules';
import { useModuleListController } from '@/modules/shared/hooks/useModuleListController';
import { useModulesQuery } from '../hooks/useModulesQuery';
import { useDeleteModule } from '../hooks/useDeleteModule';
import type { Module } from '../types';
import { AdminModuleFormDrawer } from '../components/AdminModuleFormDrawer';
import { AdminModulesTable } from './_components/admin-modules-table';
import { ModuleCategoryProvider, useModuleCategoryStore } from '../lib/module-store';
import { useQueryClient } from '@tanstack/react-query';
import { ADMIN_MODULES_QUERY_KEY } from '../hooks/useModulesQuery';

function ModuleListInner() {
  const ctrl = useModuleListController<Module>({
    defaultPageSize: 25,
  });
  const queryClient = useQueryClient();
  const { data, isLoading } = useModulesQuery(ctrl.params);
  const deleteMutation = useDeleteModule();
  const [duplicateFrom, setDuplicateFrom] = useState<Module | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Module | undefined>();
  const [catFilterOpen, setCatFilterOpen] = useState(false);
  const { categories: filterCategories } = useModuleCategoryStore();

  const selectedCategories = ctrl.draftCategory;

  const toggleCategoryFilter = (categoryId: string) => {
    const next = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((c) => c !== categoryId)
      : [...selectedCategories.filter((c) => c !== 'all'), categoryId];
    ctrl.setDraftCategory(next.length > 0 ? next : ['all']);
    ctrl.handleSearch();
  };

  const usedCategoryIds = useMemo(() => new Set(data?.data.map((m) => m.category) ?? []), [data]);

  const handleCategoryChange = useCallback(
    (moduleId: string, newCategory: string) => {
      queryClient.setQueriesData<{ data: Module[]; total: number }>(
        { queryKey: ADMIN_MODULES_QUERY_KEY },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data.map((m) => (m.id === moduleId ? { ...m, category: newCategory } : m)),
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
            <Popover open={catFilterOpen} onOpenChange={setCatFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-label="Filtrer par catégorie"
                  className="h-9 w-44 justify-between font-normal text-xs"
                >
                  {selectedCategories.includes('all') || selectedCategories.length === 0
                    ? 'Toutes les catégories'
                    : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`}
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
                        ctrl.setDraftCategory(['all']);
                        ctrl.handleSearch();
                        setCatFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          selectedCategories.includes('all') ? 'opacity-100' : 'opacity-0',
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
                            'mr-2 size-4',
                            selectedCategories.includes(cat.id) ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        {cat.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              onClick={ctrl.handleOpenCreate}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
            >
              <Plus className="size-4" />
              Nouveau module
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
          onEdit={ctrl.handleEdit}
          onDuplicate={setDuplicateFrom}
          onDelete={setDeleteConfirm}
          onCategoryChange={handleCategoryChange}
        />

        <AdminModuleFormDrawer
          open={ctrl.isDrawerOpen || !!duplicateFrom}
          onClose={() => {
            ctrl.handleCloseDrawer();
            setDuplicateFrom(undefined);
          }}
          onSuccess={() => {
            ctrl.handleSuccess();
            setDuplicateFrom(undefined);
          }}
          module={ctrl.editingModule}
          duplicateFrom={duplicateFrom}
          usedCategoryIds={usedCategoryIds}
        />

        <AlertDialog
          open={!!deleteConfirm}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(undefined);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le module</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le module « {deleteConfirm?.name}» ? Cette action
                est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/80"
                onClick={() => {
                  if (deleteConfirm) deleteMutation.mutate(deleteConfirm.id);
                  setDeleteConfirm(undefined);
                }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
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
