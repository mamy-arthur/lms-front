"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
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
  onEdit?: (question: Question) => void;
  onDuplicate?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onToggleActive?: (question: Question) => void;
}

function AdminQuestionsTableBase({
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
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: AdminQuestionsTableProps) {
  const ActionMenu = useCallback(function ActionMenu({ item }: { item: Question }) {
    return (
      <div className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
              aria-label={`Actions pour ${item.name}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit?.(item)}>
              <Pencil className="mr-2 size-3.5 text-muted-foreground" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(item)}>
              <Copy className="mr-2 size-3.5 text-muted-foreground" />
              Dupliquer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(item)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-3.5" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }, [onEdit, onDuplicate, onDelete]);

  const ToggleActive = useCallback(function ToggleActive({ item }: { item: Question }) {
    return (
      <Switch
        checked={item.isActive}
        onCheckedChange={() => onToggleActive?.(item)}
        size="sm"
        className="data-[state=checked]:bg-(--color-primary)"
      />
    );
  }, [onToggleActive]);

  const columns: DataTableColumn<Question>[] = useMemo(() => [
    {
      key: "referenceNumber",
      label: "Référence",
      sortable: true,
      render: (question) => (
        <span className="text-xs font-medium text-foreground">
          {question.referenceNumber}
        </span>
      ),
    },
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (question) => (
        <span className="text-xs text-muted-foreground">
          {question.name}
        </span>
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
      render: (question) => <ToggleActive item={question} />,
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
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (question) => <ActionMenu item={question} />,
    },
  ], [onEdit, onDuplicate, onDelete, onToggleActive]);

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

export const AdminQuestionsTable = memo(AdminQuestionsTableBase);
