'use client';

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import type { PurchasedLearningPathRow, PurchasedLearningPathStatKey } from '../../types';
import { PurchasedLearningPathStatTrigger } from './stat-trigger';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface PurchasedLearningPathsTableProps {
  purchasedLearningPaths: PurchasedLearningPathRow[];
  page: number;
  pageSize: number;
  total: number;
  sort?: DataTableSort;
  hasQuery?: boolean;
  isLoading?: boolean;
  onSort: (column: string) => void;
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
  sort,
  hasQuery = false,
  isLoading = false,
  onSort,
  onPageChange,
  onPageSizeChange,
  onStatClick,
  onAssign,
}: PurchasedLearningPathsTableProps) {
  const columns: DataTableColumn<PurchasedLearningPathRow>[] = [
    {
      key: 'name',
      label: 'Nom de la formation',
      sortable: true,
      render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: 'cumulative',
      label: 'Inscrits cumulés',
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
          className=" text-black"
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
      sort={sort}
      isLoading={isLoading}
      hasQuery={hasQuery}
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
