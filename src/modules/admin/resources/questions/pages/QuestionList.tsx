"use client";

import { useMemo } from "react";
import { QuizSearch } from "@modules/shared/components/quizzes";
import { useQuestionListController } from "@/modules/shared/hooks/useQuestionListController";
import { MOCK_QUIZZES } from "@modules/shared/components/quizzes/mocks/quizzes.mock";
import { useQuestionsQuery } from "../hooks/useQuestionsQuery";
import type { Question } from "../types";
import { AdminQuestionsTable } from "./_components/admin-questions-table";

export function QuestionList({ quizId }: { quizId: string }) {
  const ctrl = useQuestionListController<Question>({
    defaultPageSize: 25,
  });
  const { data, isLoading } = useQuestionsQuery(ctrl.params);

  const quizName = useMemo(() => {
    const quiz = MOCK_QUIZZES.find((q) => q.id === quizId);
    return String(quiz?.title ?? quizId ?? "");
  }, [quizId]);

  const filteredQuestions = useMemo(
    () => (data?.data ?? []).filter((q) => q.quizId === quizId),
    [data, quizId],
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
        />
      </div>
    </div>
  );
}
