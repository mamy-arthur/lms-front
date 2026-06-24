"use client";

import { QuizSearch } from "@modules/shared/components/quizzes";
import { MOCK_QUIZZES } from "@modules/shared/components/quizzes/mocks/quizzes.mock";
import { Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useQuestionListController } from "@/modules/shared/hooks/useQuestionListController";
import { QuestionFormModal } from "../components/question-form-modal";
import { useDeleteQuestion } from "../hooks/useDeleteQuestion";
import { useQuestionsQuery } from "../hooks/useQuestionsQuery";
import { useUpdateQuestion } from "../hooks/useUpdateQuestion";
import type { Question } from "../types";
import { QuestionsTable } from "./_components/questions-table";

export function QuestionList({ quizId }: { quizId: string }) {
  const ctrl = useQuestionListController<Question>({ defaultPageSize: 25 });
  const { data } = useQuestionsQuery();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  const quizName = useMemo(() => {
    const quiz = MOCK_QUIZZES.find((q) => q.id === quizId);
    return String(quiz?.title ?? quizId ?? "");
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
          identificationNumber: question.identificationNumber,
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

  const handleDelete = useCallback(
    (question: Question) => {
      deleteMutation.mutate(question.id);
    },
    [deleteMutation],
  );

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

        <QuestionsTable
          questions={filteredQuestions}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={filteredQuestions.length}
          sort={ctrl.sort}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
          onEdit={ctrl.handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      </div>

      <QuestionFormModal
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        question={ctrl.editingQuestion}
        defaultQuizId={quizId}
      />
    </div>
  );
}
