'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { formatDate } from '@/shared/lib/date';
import { QUESTION_TYPE_LABELS } from '@modules/shared/components/questions';
import type { Question } from '../../types';

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
  onDelete?: (question: Question) => void;
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
  onDelete,
}: AdminQuestionsTableProps) {
  const ActionMenu = useCallback(
    function ActionMenu({ item }: { item: Question }) {
      return (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                aria-label={`Actions pour la question`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit?.(item)}>
                <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                Modifier
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
    },
    [onEdit, onDelete],
  );

  const columns: DataTableColumn<Question>[] = useMemo(
    () => [
      {
        key: 'referenceNumber',
        label: 'Référence',
        sortable: true,
        render: (q) => (
          <span className="font-mono text-xs font-medium text-foreground">{q.referenceNumber}</span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        render: (q) => (
          <Badge variant="outline" className="text-xs">
            {QUESTION_TYPE_LABELS[q.type] ?? q.type}
          </Badge>
        ),
      },
      {
        key: 'text',
        label: 'Question',
        sortable: false,
        render: (q) => (
          <span className="line-clamp-2 max-w-sm text-xs text-muted-foreground">
            {q.text.replace(/<[^>]*>/g, '')}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Dernière modification',
        sortable: true,
        render: (q) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {q.updatedAt ? formatDate(q.updatedAt) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (q) => <ActionMenu item={q} />,
      },
    ],
    [onEdit, onDelete],
  );

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
        title: 'Aucune question',
        description: 'Ajoutez votre première question à cette banque.',
      }}
    />
  );
}

export const AdminQuestionsTable = memo(AdminQuestionsTableBase);
