'use client';

import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import type { PurchasedLearningPathRow, PurchasedLearningPathStatKey } from '../../types';
import { PurchasedLearningPathStatTrigger } from './stat-trigger';

interface PurchasedLearningPathsTableProps {
  purchasedLearningPaths: PurchasedLearningPathRow[];
  page: number;
  pageSize: number;
  total: number;
  hasQuery?: boolean;
  isLoading?: boolean;
  sort?: DataTableSort;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onStatClick: (
    purchasedLearningPath: PurchasedLearningPathRow,
    stat: PurchasedLearningPathStatKey,
  ) => void;
  onAssign: (purchasedLearningPath: PurchasedLearningPathRow) => void;
}

export function PurchasedLearningPathsTable({
  purchasedLearningPaths,
  page,
  pageSize,
  total,
  hasQuery = false,
  isLoading = false,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onStatClick,
  onAssign,
}: PurchasedLearningPathsTableProps) {
  const columns: DataTableColumn<PurchasedLearningPathRow>[] = [
    {
      key: 'name',
      label: 'Parcours de formation',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: external backend URL, domain unknown at build time
            <img
              src={row.imageUrl}
              alt={row.name}
              className="size-11 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="size-10 shrink-0 rounded-md bg-muted" />
          )}
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Catégorie',
      sortable: true,
      render: (row) =>
        row.categoryName ? (
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs font-normal">
            {row.categoryName}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'cumulative',
      label: 'Inscrits cumulés',
      sortable: true,
      render: (row) => (
        <PurchasedLearningPathStatTrigger
          label="Cumulés"
          value={row.stats.cumulative}
          onClick={() => onStatClick(row, 'cumulative')}
        />
      ),
    },
    {
      key: 'inProgress',
      label: 'Inscrits en cours',
      sortable: true,
      render: (row) => (
        <PurchasedLearningPathStatTrigger
          label="En cours"
          value={row.stats.inProgress}
          onClick={() => onStatClick(row, 'inProgress')}
        />
      ),
    },
    {
      key: 'notStarted',
      label: 'Non commencés',
      sortable: true,
      render: (row) => (
        <PurchasedLearningPathStatTrigger
          label="Non commencés"
          value={row.stats.notStarted}
          onClick={() => onStatClick(row, 'notStarted')}
        />
      ),
    },
    {
      key: 'availableCredits',
      label: 'Crédits disponibles',
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
          {row.stats.availableCredits}
        </Badge>
      ),
    },
    {
      key: 'assign',
      label: '',
      render: (row) => (
        <Button
          type="button"
          size="sm"
          onClick={() => onAssign(row)}
          variant={'outline'}
          className="text-foreground"
        >
          <ChevronRight className="size-3" />
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      data={purchasedLearningPaths}
      columns={columns}
      page={page}
      pageSize={pageSize}
      total={total}
      isLoading={isLoading}
      hasQuery={hasQuery}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onAssign}
      emptyState={{
        title: 'Aucune formation achetée',
        description:
          "Aucune formation achetée n'est disponible. Les formations non achetées sont masquées.",
      }}
    />
  );
}
