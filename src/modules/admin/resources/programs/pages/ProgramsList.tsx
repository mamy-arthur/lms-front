'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useLearningPathsQuery } from '../hooks/useLearningPathsQuery';
import { useLearningPathCategoriesQuery } from '../hooks/useLearningPathCategoriesQuery';
import { useDeleteLearningPath } from '../hooks/useDeleteLearningPath';
import { LearningPathsTable } from './_components/learning-paths-table';
import { LearningPathFormDrawer } from './_components/learning-path-form-drawer';
import { LearningPathCategoriesDrawer } from './_components/learning-path-categories-drawer';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { LearningPath } from '../types';

export function ProgramsList() {
  const learningPathsQuery = useLearningPathsQuery();
  const categoriesQuery = useLearningPathCategoriesQuery();
  const deleteMutation = useDeleteLearningPath();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | undefined>(undefined);
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);

  const openNew = () => {
    setEditingPath(undefined);
    setDrawerOpen(true);
  };

  const openEdit = (path: LearningPath) => {
    setEditingPath(path);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Parcours supprimé');
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          'Impossible de supprimer ce parcours. Détachez d’abord toutes les compétences liées, puis réessayez.',
        ),
      );
    }
  };

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
          learningPaths={learningPathsQuery.data ?? []}
          categories={categoriesQuery.data ?? []}
          isLoading={learningPathsQuery.isLoading}
          onNew={openNew}
          onEdit={openEdit}
          onDelete={handleDelete}
          onManageCategories={() => setCategoriesDrawerOpen(true)}
        />
      </div>

      <LearningPathFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        learningPath={editingPath}
        categories={categoriesQuery.data ?? []}
      />

      <LearningPathCategoriesDrawer
        open={categoriesDrawerOpen}
        onOpenChange={setCategoriesDrawerOpen}
        categories={categoriesQuery.data ?? []}
        isLoading={categoriesQuery.isLoading}
      />
    </div>
  );
}
