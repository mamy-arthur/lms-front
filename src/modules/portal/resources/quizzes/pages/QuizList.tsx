"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModuleListController } from "@/modules/shared/hooks/useModuleListController";
import { QuizSearch } from "@modules/shared/components/quizzes";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import { QuizFormDrawer } from "../components/QuizFormDrawer";
import { useQuizzesQuery } from "../hooks/useQuizzesQuery";
import type { Quiz } from "../types";
import { QuizzesTable } from "./_components/quizzes-table";

export function QuizList() {
  const ctrl = useModuleListController<Quiz>({ defaultPageSize: 25 });
  const { data } = useQuizzesQuery(ctrl.params);

  return (
    <div className="bg-background">
      <header className="mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et organisez vos quizzes.
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <QuizSearch
          value={ctrl.draftSearch}
          onChange={ctrl.setDraftSearch}
          onSearch={ctrl.handleSearch}
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="space-y-1">
            <Select value={ctrl.draftCategory} onValueChange={ctrl.setDraftCategory}>
              <SelectTrigger aria-label="Filtrer par formation" className="w-44">
                <SelectValue placeholder="Toutes les formations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {MOCK_COURSES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={ctrl.handleOpenCreate}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
          >
            <Plus className="size-4" />
            Nouveau quiz
          </Button>
        </div>
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
