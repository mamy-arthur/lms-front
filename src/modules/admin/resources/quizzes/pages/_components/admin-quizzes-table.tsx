'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, MoreHorizontal, Pencil, PowerOff } from 'lucide-react';
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
              {item.isActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <PowerOff className="mr-2 size-3.5" />
                    Désactiver
                  </DropdownMenuItem>
                </>
              )}
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
        key: 'idnumber',
        label: 'Référence',
        sortable: true,
        render: (quiz) => (
          <span className="font-mono text-xs font-medium text-foreground">{quiz.idnumber}</span>
        ),
      },
      {
        key: 'title',
        label: 'Titre',
        sortable: true,
        render: (quiz) => <span className="text-xs text-muted-foreground">{quiz.title}</span>,
      },
      {
        key: 'isActive',
        label: 'Statut',
        sortable: false,
        render: (quiz) =>
          quiz.isActive ? (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-xs"
            >
              Active
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-destructive/40 bg-destructive/10 text-destructive text-xs"
            >
              Désactivée
            </Badge>
          ),
      },
      {
        key: 'learningPathIds',
        label: 'Parcours liés',
        sortable: false,
        render: (quiz) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {quiz.learningPathIds.length}
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
        title: 'Aucune banque de questions',
        description: 'Créez votre première banque pour commencer.',
      }}
    />
  );
}

export const AdminQuizzesTable = memo(AdminQuizzesTableBase);
