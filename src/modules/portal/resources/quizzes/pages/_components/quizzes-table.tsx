"use client";

import { useRouter } from "next/navigation";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { formatDate } from "@/shared/lib/date";
import { getFormationName } from "@/shared/lib/formations";
import { ROUTES } from "@/shared/constants/routes";
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
}: QuizzesTableProps) {
  const router = useRouter();
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
      onRowClick={(quiz) => router.push(ROUTES.portal.quizQuestions(quiz.id))}
      emptyState={{
        title: "Aucun quiz",
        description: "Aucun quiz pour le moment.",
      }}
    />
  );
}
