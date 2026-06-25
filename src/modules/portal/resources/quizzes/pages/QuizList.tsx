"use client";

import { useQuizListController } from "@/modules/shared/hooks/useQuizListController";
import { QuizSearch } from "@modules/shared/components/quizzes";
import { useQuizzesQuery } from "../hooks/useQuizzesQuery";
import type { Quiz } from "../types";
import { QuizzesTable } from "./_components/quizzes-table";

export function QuizList() {
  const ctrl = useQuizListController<Quiz>({ defaultPageSize: 25 });
  const { data } = useQuizzesQuery(ctrl.params);

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez les quizzes de vos formations.
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

        <QuizzesTable
          quizzes={data?.data ?? []}
          hasQuery={ctrl.hasQuery}
          page={ctrl.page}
          pageSize={ctrl.pageSize}
          total={data?.total ?? 0}
          sort={ctrl.sort}
          onSort={ctrl.handleSort}
          onPageChange={ctrl.handlePageChange}
          onPageSizeChange={ctrl.handlePageSizeChange}
        />
      </div>
    </div>
  );
}
