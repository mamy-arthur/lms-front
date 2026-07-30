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
import { TYPE_ICONS } from '../../components/question-form-constants';

const TYPE_BADGE_CLASSES: Record<string, string> = {
  true_false:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
  single_choice:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
  multiple_choice:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400',
  matching:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
};

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
          <Badge variant="outline" className={`gap-1 ${TYPE_BADGE_CLASSES[q.type] ?? ''}`}>
            <span className={`[&>svg]:size-3 ${TYPE_ICONS[q.type]?.color ?? ''}`}>
              {TYPE_ICONS[q.type]?.icon}
            </span>
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
