'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { getFormationName } from '@/shared/lib/formations';
import { ROUTES } from '@/shared/constants/routes';
import type { Quiz } from '../../types';

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
  onEdit?: (quiz: Quiz) => void;
  onDuplicate?: (quiz: Quiz) => void;
  onDelete?: (quiz: Quiz) => void;
}

function AdminQuizzesTableBase({
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
  onEdit,
  onDuplicate,
  onDelete,
}: AdminQuizzesTableProps) {
  const router = useRouter();

  const handleRowClick = useCallback(
    (quiz: Quiz) => {
      router.push(ROUTES.admin.quizQuestions(quiz.id));
    },
    [router],
  );

  const ActionMenu = useCallback(
    function ActionMenu({ item }: { item: Quiz }) {
      return (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                aria-label={`Actions pour ${item.title}`}
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
    },
    [onEdit, onDuplicate, onDelete],
  );

  const columns: DataTableColumn<Quiz>[] = useMemo(
    () => [
      {
        key: 'slug',
        label: 'Référence',
        sortable: true,
        render: (quiz) => <span className="text-xs font-medium text-foreground">{quiz.slug}</span>,
      },
      {
        key: 'title',
        label: 'Titre',
        sortable: true,
        render: (quiz) => <span className="text-xs text-muted-foreground">{quiz.title}</span>,
      },
      {
        key: 'formationId',
        label: 'Formation',
        sortable: true,
        render: (quiz) => (
          <span className="text-xs text-muted-foreground">
            {getFormationName(quiz.formationId) || '—'}
          </span>
        ),
      },
      {
        key: 'questionCount',
        label: 'Nb questions',
        sortable: true,
        render: (quiz) => (
          <span className="text-xs text-muted-foreground tabular-nums">{quiz.questionCount}</span>
        ),
      },
      {
        key: 'activeQuestionCount',
        label: 'Actives',
        sortable: true,
        render: (quiz) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {quiz.activeQuestionCount}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Dernière modification',
        sortable: true,
        render: (quiz) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {quiz.updatedAt ? formatDate(quiz.updatedAt) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: '',
        sortable: false,
        render: (quiz) => <ActionMenu item={quiz} />,
      },
    ],
    [onEdit, onDuplicate, onDelete],
  );

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
      onRowClick={handleRowClick}
      emptyState={{
        title: 'Aucun quiz',
        description: 'Aucun quiz pour le moment.',
      }}
    />
  );
}

export const AdminQuizzesTable = memo(AdminQuizzesTableBase);
