"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { QuizzesFilters } from "@/shared/components/quizzes";
import { QuizFormDrawer } from "../components/QuizFormDrawer";
import { useQuizzesQuery } from "../hooks/useQuizzesQuery";
import type { Quiz } from "../types";
import { QuizzesTable } from "./_components/quizzes-table";

export function QuizList() {
  const ctrl = useModuleListController<Quiz>({ defaultPageSize: 25 });
  const { data } = useQuizzesQuery(ctrl.params);

  return (
    <div className="bg-background">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et organisez vos quizzes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
          >
            <Plus className="mr-1 size-4" />
            Nouveau quiz
          </Button>
        </div>
      </header>

      <QuizzesFilters
        search={ctrl.draftSearch}
        formationFilter={ctrl.draftCategory}
        onSearchChange={ctrl.setDraftSearch}
        onFormationFilterChange={ctrl.setDraftCategory}
        onSearch={ctrl.handleSearch}
      />

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
        onEdit={ctrl.handleEdit}
        onDelete={() => {}}
      />

      <QuizFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        quiz={ctrl.editingModule}
      />
    </div>
  );
}
