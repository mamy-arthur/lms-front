"use client";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/shared/lib/date";
import { QUESTION_TYPE_LABELS } from "@modules/shared/components/questions";
import type { Question } from "../../types";

export type SortConfig = DataTableSort;

interface AdminQuestionsTableProps {
  questions: Question[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function AdminQuestionsTable({
  questions,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
}: AdminQuestionsTableProps) {
  const columns: DataTableColumn<Question>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (question) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {question.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {question.identificationNumber}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (question) => (
        <span className="text-xs text-muted-foreground">
          {QUESTION_TYPE_LABELS[question.type] ?? question.type}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Actif",
      sortable: true,
      render: (question) => (
        <Switch
          checked={question.isActive}
          disabled
          size="sm"
          className="data-[state=checked]:bg-(--color-primary)"
        />
      ),
    },
    {
      key: "updatedAt",
      label: "Dernière modification",
      sortable: true,
      render: (question) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {question.updatedAt ? formatDate(question.updatedAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={questions}
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
      rowTestId="admin-question-row"
      emptyState={{
        title: "Aucune question",
        description: "Aucune question pour le moment.",
      }}
    />
  );
}
