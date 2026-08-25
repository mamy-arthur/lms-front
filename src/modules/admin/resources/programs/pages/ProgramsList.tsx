'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useLearningPathsQuery } from '../hooks/useLearningPathsQuery';
import { useLearningPathCategoriesQuery } from '../hooks/useLearningPathCategoriesQuery';
import { useDeleteLearningPath } from '../hooks/useDeleteLearningPath';
import { LearningPathsTable } from './_components/learning-paths-table';
import { LearningPathFormDrawer } from './_components/learning-path-form-drawer';
import { LearningPathCategoriesDrawer } from './_components/learning-path-categories-drawer';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { LearningPath } from '../types';
import type { LearningPathListParams } from '@/shared/api/learning-paths.api';

export function ProgramsList() {
  const categoriesQuery = useLearningPathCategoriesQuery();
  const deleteMutation = useDeleteLearningPath();

  const [params, setParams] = useState<LearningPathListParams>({
    page: 1,
    per_page: 25,
    sort_by: 'name',
    sort_order: 'asc',
  });
  const [draftSearch, setDraftSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const learningPathsQuery = useLearningPathsQuery(params);
  const page = (params.page ?? 1) - 1;
  const sort = { column: params.sort_by ?? 'name', direction: (params.sort_order ?? 'asc') as 'asc' | 'desc' };
  const hasQuery = !!(params.q || params.category_ids);

  const handleSearch = useCallback(() => {
    setParams((prev) => ({ ...prev, q: draftSearch || undefined, page: 1 }));
  }, [draftSearch]);

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    if (value === 'all') {
      setSelectedCategories([]);
      setParams((prev) => ({ ...prev, category_ids: undefined, page: 1 }));
      return;
    }
    setSelectedCategories((prev) => {
      const next = prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value];
      setParams((p) => ({ ...p, category_ids: next.length > 0 ? next.join(',') : undefined, page: 1 }));
      return next;
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setParams((prev) => ({ ...prev, per_page: newSize, page: 1 }));
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPathId, setEditingPathId] = useState<string | undefined>(undefined);
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);

  const openNew = () => { setEditingPathId(undefined); setDrawerOpen(true); };
  const openEdit = (path: LearningPath) => { setEditingPathId(path.id); setDrawerOpen(true); };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Parcours supprimé');
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de supprimer ce parcours. Détachez d'abord toutes les compétences liées, puis réessayez."));
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
          learningPaths={learningPathsQuery.data?.data ?? []}
          categories={categoriesQuery.data ?? []}
          isLoading={learningPathsQuery.isLoading}
          hasQuery={hasQuery}
          page={page}
          pageSize={params.per_page ?? 25}
          total={learningPathsQuery.data?.total ?? 0}
          sort={sort}
          draftSearch={draftSearch}
          onDraftSearchChange={setDraftSearch}
          onSearch={handleSearch}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onNew={openNew}
          onEdit={openEdit}
          onDelete={handleDelete}
          onManageCategories={() => setCategoriesDrawerOpen(true)}
        />
      </div>

      <LearningPathFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        learningPathId={editingPathId}
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
