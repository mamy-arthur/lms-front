"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuizListController } from "@/modules/shared/hooks/useQuizListController";
import { QuizSearch } from "@modules/shared/components/quizzes";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import { QuizFormDrawer } from "../components/QuizFormDrawer";
import { useQuizzesQuery } from "../hooks/useQuizzesQuery";
import type { Quiz } from "../types";
import { QuizzesTable } from "./_components/quizzes-table";

export function QuizList() {
  const ctrl = useQuizListController<Quiz>({ defaultPageSize: 25 });
  const { data } = useQuizzesQuery(ctrl.params);
  const [filterOpen, setFilterOpen] = useState(false);

  const isAllSelected =
    ctrl.draftCategory.length === 0 || ctrl.draftCategory.includes("all");

  const toggleFormation = (formationId: string) => {
    ctrl.setDraftCategory((prev) => {
      if (prev.includes("all")) return [formationId];
      if (prev.includes(formationId)) {
        const next = prev.filter((id) => id !== formationId);
        return next.length === 0 ? ["all"] : next;
      }
      return [...prev, formationId];
    });
  };

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, modifiez et organisez vos quizzes.
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
            <div className="space-y-1">
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-label="Filtrer par formation"
                    className="w-44 justify-between font-normal"
                  >
                    {isAllSelected
                      ? "Toutes les formations"
                      : `${ctrl.draftCategory.length} formation${ctrl.draftCategory.length > 1 ? "s" : ""}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Rechercher une formation..." />
                    <CommandEmpty>Aucune formation trouvée.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {MOCK_COURSES.map((course) => {
                          const isSelected = ctrl.draftCategory.includes(course.id);
                          return (
                            <CommandItem
                              key={course.id}
                              value={course.fullName}
                              onSelect={() => toggleFormation(course.id)}
                              data-checked={isSelected ? "true" : undefined}
                            >
                              {course.fullName}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
      </div>

      <QuizFormDrawer
        open={ctrl.isDrawerOpen}
        onClose={ctrl.handleCloseDrawer}
        onSuccess={ctrl.handleSuccess}
        quiz={ctrl.editingQuiz}
      />
    </div>
  );
}
