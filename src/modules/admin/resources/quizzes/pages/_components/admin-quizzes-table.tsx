"use client";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { formatDate } from "@/shared/lib/date";
import { getFormationName } from "@/shared/lib/formations";
import type { Quiz } from "../../types";

export type SortConfig = DataTableSort;

interface AdminQuizzesTableProps {
  quizzes: Quiz[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  tenantNames: Record<string, string>;
}

export function AdminQuizzesTable({
  quizzes,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  tenantNames,
}: AdminQuizzesTableProps) {
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
      key: "tenantId",
      label: "Tenant",
      sortable: true,
      render: (quiz) => (
        <span className="text-xs text-muted-foreground">
          {tenantNames[quiz.tenantId] || quiz.tenantId || "—"}
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
      isLoading={isLoading}
      hasQuery={hasQuery}
      page={page}
      pageSize={pageSize}
      total={total}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      rowTestId="admin-quiz-row"
      emptyState={{
        title: "Aucun quiz",
        description: "Aucun quiz pour le moment.",
      }}
    />
  );
}
