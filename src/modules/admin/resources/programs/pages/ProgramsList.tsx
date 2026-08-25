'use client';

import { useLearningPathsQuery } from '../hooks/useLearningPathsQuery';
import { useLearningPathCategoriesQuery } from '../hooks/useLearningPathCategoriesQuery';
import { useDeleteLearningPath } from '../hooks/useDeleteLearningPath';
import { useProgramListController } from '../hooks/useProgramListController';
import { LearningPathsTable } from './_components/learning-paths-table';
import { LearningPathFormDrawer } from './_components/learning-path-form-drawer';
import { LearningPathCategoriesDrawer } from './_components/learning-path-categories-drawer';

export function ProgramsList() {
  const ctrl = useProgramListController();
  const categoriesQuery = useLearningPathCategoriesQuery();
  const learningPathsQuery = useLearningPathsQuery(ctrl.params);
  const deleteMutation = useDeleteLearningPath();

  return (
    <div className="bg-background">
      <div className="mx-auto w-full space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des parcours</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez, modifiez et organisez les parcours de votre plateforme.
            </p>
          </div>
        </header>

        <LearningPathsTable
          learningPaths={learningPathsQuery.data?.data ?? []}
          categories={categoriesQuery.data ?? []}
          isLoading={learningPathsQuery.isLoading}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={learningPathsQuery.data?.total ?? 0}
          sort={ctrl.sort}
          draftSearch={ctrl.draftSearch}
          onDraftSearchChange={ctrl.setDraftSearch}
          onSearch={ctrl.handleSearch}
          selectedCategories={ctrl.selectedCategories}
          onCategoryChange={ctrl.handleCategoryChange}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
          onNew={ctrl.openNew}
          onEdit={(path) => ctrl.openEdit(path.id)}
          onDelete={(id) => deleteMutation.mutate(id)}
          onManageCategories={() => ctrl.setCategoriesDrawerOpen(true)}
        />
      </div>

      <LearningPathFormDrawer
        open={ctrl.drawerOpen}
        onOpenChange={(open) => {
          if (!open) ctrl.closeDrawer();
        }}
        learningPathId={ctrl.editingPathId}
        categories={categoriesQuery.data ?? []}
      />

      <LearningPathCategoriesDrawer
        open={ctrl.categoriesDrawerOpen}
        onOpenChange={ctrl.setCategoriesDrawerOpen}
        categories={categoriesQuery.data ?? []}
        isLoading={categoriesQuery.isLoading}
      />
    </div>
  );
}
