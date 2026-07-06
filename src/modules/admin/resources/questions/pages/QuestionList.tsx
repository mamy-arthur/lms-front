/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';
import { QuizSearch } from '@modules/shared/components/quizzes';
import { MOCK_QUIZZES } from '@modules/shared/components/quizzes/mocks/quizzes.mock';
import { useQuestionListController } from '@/modules/shared/hooks/useQuestionListController';
import { useQuestionsQuery } from '../hooks/useQuestionsQuery';
import { useUpdateQuestion } from '../hooks/useUpdateQuestion';
import { useDeleteQuestion } from '../hooks/useDeleteQuestion';
import type { Question } from '../types';
import { AdminQuestionsTable } from './_components/admin-questions-table';
import { QuestionFormModal } from '../components/question-form-modal';

export function QuestionList({ quizId }: { quizId: string }) {
  const ctrl = useQuestionListController<Question>({
    defaultPageSize: 25,
  });
  const { data, isLoading } = useQuestionsQuery(ctrl.params);
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();
  const [duplicateFrom, setDuplicateFrom] = useState<Question | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Question | undefined>();

  const quizName = useMemo(() => {
    const quiz = MOCK_QUIZZES.find((q) => q.id === quizId);
    return String(quiz?.title ?? quizId ?? '');
  }, [quizId]);

  const filteredQuestions = useMemo(
    () => (data?.data ?? []).filter((q) => q.quizId === quizId),
    [data, quizId],
  );

  const handleToggleActive = useCallback(
    (question: Question) => {
      updateMutation.mutate({
        id: question.id,
        data: {
          quizId: question.quizId,
          name: question.name,
          text: question.text,
          type: question.type,
          generalFeedback: question.generalFeedback,
          referenceNumber: question.referenceNumber,
          isActive: !question.isActive,
          duration: question.duration as any,
          moduleId: question.moduleId,
          correctAnswer: question.correctAnswer,
          feedbackTrue: question.feedbackTrue,
          feedbackFalse: question.feedbackFalse,
          options: question.options,
          pairs: question.pairs,
        },
      });
    },
    [updateMutation],
  );

  const handleDeleteConfirm = useCallback((question: Question) => setDeleteConfirm(question), []);

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Questions du quiz : <span className="font-medium">{quizName}</span>
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
          questions={filteredQuestions}
          isLoading={isLoading}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={filteredQuestions.length}
          sort={ctrl.sort}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
          onEdit={ctrl.handleEdit}
          onDuplicate={setDuplicateFrom}
          onDelete={handleDeleteConfirm}
          onToggleActive={handleToggleActive}
        />
      </div>

      <QuestionFormModal
        open={ctrl.isDrawerOpen || !!duplicateFrom}
        onClose={() => {
          ctrl.handleCloseDrawer();
          setDuplicateFrom(undefined);
        }}
        onSuccess={() => {
          ctrl.handleSuccess();
          setDuplicateFrom(undefined);
        }}
        question={ctrl.editingQuestion}
        duplicateFrom={duplicateFrom}
        defaultQuizId={quizId}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer la question"
        description={
          <>
            Êtes-vous sûr de vouloir supprimer la question « {deleteConfirm?.name}» ? Cette action
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
  );
}
