"use client";

import { QUESTION_TYPE_LABELS } from "@modules/shared/components/questions";
import { Switch } from "@/components/ui/switch";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { formatDate } from "@/shared/lib/date";
import type { Question } from "../../types";

export type SortConfig = DataTableSort;

interface QuestionsTableProps {
  questions: Question[];
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function QuestionsTable({
  questions,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
}: QuestionsTableProps) {
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
      hasQuery={hasQuery}
      page={page}
      pageSize={pageSize}
      total={total}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      rowTestId="question-row"
      emptyState={{
        title: "Aucune question",
        description: "Aucune question pour le moment.",
      }}
    />
  );
}
