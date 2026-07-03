'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';
import { QuizSearch } from '@modules/shared/components/quizzes';
import { useQuizListController } from '@/modules/shared/hooks/useQuizListController';
import { useQuizzesQuery } from '../hooks/useQuizzesQuery';
import { useDeleteQuiz } from '../hooks/useDeleteQuiz';
import type { Quiz } from '../types';
import { AdminQuizFormDrawer } from '../components/AdminQuizFormDrawer';
import { AdminQuizzesTable } from './_components/admin-quizzes-table';

export function QuizList() {
  const ctrl = useQuizListController<Quiz>({
    defaultPageSize: 25,
  });
  const { data, isLoading } = useQuizzesQuery(ctrl.params);
  const deleteMutation = useDeleteQuiz();
  const [duplicateFrom, setDuplicateFrom] = useState<Quiz | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Quiz | undefined>();

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et gérez les quizzes de vos formations.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <QuizSearch
            value={ctrl.draftSearch}
            onChange={ctrl.setDraftSearch}
            onSearch={ctrl.handleSearch}
          />
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button
              onClick={ctrl.handleOpenCreate}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
            >
              <Plus className="size-4" />
              Nouveau quiz
            </Button>
          </div>
        </div>

        <AdminQuizzesTable
          quizzes={data?.data ?? []}
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
        />

        <AdminQuizFormDrawer
          open={ctrl.isDrawerOpen || !!duplicateFrom}
          onClose={() => {
            ctrl.handleCloseDrawer();
            setDuplicateFrom(undefined);
          }}
          onSuccess={() => {
            ctrl.handleSuccess();
            setDuplicateFrom(undefined);
          }}
          quiz={ctrl.editingQuiz}
          duplicateFrom={duplicateFrom}
        />

        <ConfirmDialog
          open={!!deleteConfirm}
          title="Supprimer le quiz"
          description={
            <>
              Êtes-vous sûr de vouloir supprimer le quiz « {deleteConfirm?.title}» ? Cette action
              est irréversible.
            </>
          }
          confirmClassName="bg-destructive hover:bg-destructive/80"
          onClose={() => setDeleteConfirm(undefined)}
          onConfirm={() => {
            if (deleteConfirm) deleteMutation.mutate(deleteConfirm.id);
          }}
        />
      </div>
    </div>
  );
}
