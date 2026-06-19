"use client";

import { QuizActions } from "@modules/shared/components/quizzes";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { formatDate } from "@/shared/lib/date";
import { getFormationName } from "@/shared/lib/formations";
import type { Quiz } from "../../types";

export type SortConfig = DataTableSort;

interface QuizzesTableProps {
  quizzes: Quiz[];
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (quiz: Quiz) => void;
  onDelete?: (quiz: Quiz) => void;
}

export function QuizzesTable({
  quizzes,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: QuizzesTableProps) {
  const columns: DataTableColumn<Quiz>[] = [
    {
      key: "title",
      label: "Nom",
      sortable: true,
      render: (quiz) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {quiz.title}
          </span>
          <span className="text-xs text-muted-foreground">{quiz.slug}</span>
        </div>
      ),
    },
    {
      key: "formationId",
      label: "Formation",
      sortable: true,
      render: (quiz) => (
        <span className="text-xs text-muted-foreground">
          {getFormationName(quiz.formationId) || "—"}
        </span>
      ),
    },
    {
      key: "questionCount",
      label: "Nb questions",
      sortable: true,
      render: (quiz) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {quiz.questionCount}
        </span>
      ),
    },
    {
      key: "activeQuestionCount",
      label: "Actives",
      sortable: true,
      render: (quiz) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {quiz.activeQuestionCount}
        </span>
      ),
    },
    {
      key: "updatedAt",
      label: "Dernière modification",
      sortable: true,
      render: (quiz) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {quiz.updatedAt ? formatDate(quiz.updatedAt) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (quiz) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <QuizActions
            quizLabel={quiz.title}
            onEdit={() => onEdit(quiz)}
            onDelete={onDelete ? () => onDelete(quiz) : undefined}
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={quizzes}
      columns={columns}
      hasQuery={hasQuery}
      page={page}
      pageSize={pageSize}
      total={total}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      rowTestId="quiz-row"
      emptyState={{
        title: "Aucun quiz",
        description:
          "Créez votre premier quiz en cliquant sur « Nouveau quiz ».",
      }}
    />
  );
}
