/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';
import { QuizSearch } from '@modules/shared/components/quizzes';
import { useQuestionListController } from '@/modules/shared/hooks/useQuestionListController';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useDeleteQuestion } from '../hooks/useDeleteQuestion';
import type { Question, QuestionSearchParams } from '../types';
import { AdminQuestionsTable } from './_components/admin-questions-table';
import { QuestionFormDrawer } from '../components/question-form-drawer';

export function QuestionList({ quizId }: { quizId: string }) {
  const ctrl = useQuestionListController<Question>({
    defaultPageSize: 25,
  });
  const params: QuestionSearchParams = {};
  const { data, isLoading } = useQuestionsQuery(quizId, params);
  const deleteMutation = useDeleteQuestion(quizId);
  const [deleteConfirm, setDeleteConfirm] = useState<Question | undefined>();

  const questions = data?.data ?? [];

  const handleDeleteConfirm = useCallback((question: Question) => setDeleteConfirm(question), []);

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Banque : <span className="font-mono text-xs font-medium">{quizId}</span>
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
              Nouvelle question
            </Button>
          </div>
        </div>

        <AdminQuestionsTable
          questions={questions}
          isLoading={isLoading}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={questions.length}
          sort={ctrl.sort}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
          onEdit={ctrl.handleEdit}
          onDelete={handleDeleteConfirm}
        />
      </div>

      <QuestionFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        question={ctrl.editingQuestion}
        defaultQuizId={quizId}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer la question"
        description={
          <>Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.</>
        }
        confirmClassName="bg-destructive hover:bg-destructive/80"
        onClose={() => setDeleteConfirm(undefined)}
        onConfirm={() => {
          if (deleteConfirm) deleteMutation.mutate(deleteConfirm.id);
          setDeleteConfirm(undefined);
        }}
      />
    </div>
  );
}
