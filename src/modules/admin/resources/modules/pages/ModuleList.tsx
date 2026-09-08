'use client';

import { useState } from 'react';
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
import { useModuleListController } from '@/modules/shared/hooks/useModuleListController';
import { useModules } from '../hooks/useModules';
import { useDeleteModule } from '../hooks/useDeleteModule';
import { useDuplicateModule } from '../hooks/useDuplicateModule';
import { useCompetencyCategoriesQuery } from '../hooks/useCompetencyCategoriesQuery';
import type { Module } from '../types';
import { CompetencyCategoriesManageDrawer } from '../components/categories/CompetencyCategoriesManageDrawer';
import { AdminModuleFormDrawer } from './_components/AdminModuleFormDrawer';
import { AdminModulesTable } from './_components/admin-modules-table';
import { ModuleListToolbar } from './_components/module-list-toolbar';

function ModuleListInner() {
  const ctrl = useModuleListController<Module>({
    defaultPageSize: 25,
    defaultSortBy: 'shortname',
  });
  const { data, isLoading } = useModules(ctrl.params);
  const { data: filterCategories = [] } = useCompetencyCategoriesQuery();
  const deleteMutation = useDeleteModule();
  const duplicateMutation = useDuplicateModule();
  const [deleteConfirm, setDeleteConfirm] = useState<Module | undefined>();
  const [duplicateConfirm, setDuplicateConfirm] = useState<Module | undefined>();
  const [duplicateShortname, setDuplicateShortname] = useState('');
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  const selectedCategories = ctrl.draftCategory.filter((c) => c !== 'all');

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
        <ModuleListToolbar
          draftSearch={ctrl.draftSearch}
          onDraftSearchChange={ctrl.setDraftSearch}
          onSearch={ctrl.handleSearch}
          selectedCategories={selectedCategories}
          filterCategories={filterCategories}
          onCategoryFilterChange={ctrl.handleCategoryChange}
          onManageCategories={() => setManageCategoriesOpen(true)}
          onCreateModule={ctrl.handleOpenCreate}
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
          onDuplicate={(module) => {
            setDuplicateShortname('');
            setDuplicateConfirm(module);
          }}
          onDelete={setDeleteConfirm}
        />

        <AdminModuleFormDrawer
          open={ctrl.isDrawerOpen}
          onClose={ctrl.handleCloseDrawer}
          onSuccess={ctrl.handleSuccess}
          module={ctrl.editingModule}
        />

        <CompetencyCategoriesManageDrawer
          open={manageCategoriesOpen}
          onOpenChange={setManageCategoriesOpen}
        />

        <AlertDialog
          open={!!duplicateConfirm}
          onOpenChange={(open) => {
            if (!open) setDuplicateConfirm(undefined);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dupliquer le module</AlertDialogTitle>
              <AlertDialogDescription>
                Une copie de «&nbsp;{duplicateConfirm?.shortname}&nbsp;» sera créée. Vous pouvez
                personnaliser le nom du duplicata ou laisser le champ vide pour utiliser le nom par
                défaut&nbsp;({duplicateConfirm?.shortname}-COPY).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="px-6 pb-2">
              <label className="block text-sm font-medium mb-1" htmlFor="dup-shortname">
                Nom du duplicata <span className="text-muted-foreground">(optionnel)</span>
              </label>
              <input
                id="dup-shortname"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={`${duplicateConfirm?.shortname ?? ''}-COPY`}
                value={duplicateShortname}
                onChange={(e) => setDuplicateShortname(e.target.value)}
                maxLength={255}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (duplicateConfirm)
                    duplicateMutation.mutate({
                      id: duplicateConfirm.id,
                      shortname: duplicateShortname.trim() || undefined,
                    });
                  setDuplicateConfirm(undefined);
                }}
              >
                Dupliquer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                Êtes-vous sûr de vouloir supprimer le module « {deleteConfirm?.shortname}» ? Cette
                action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/80"
                onClick={() => {
                  if (deleteConfirm)
                    deleteMutation.mutate({
                      id: deleteConfirm.id,
                      idnumber: deleteConfirm.idnumber,
                    });
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
  return <ModuleListInner />;
}
