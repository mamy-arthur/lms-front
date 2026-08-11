'use client';

import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import type { PurchasedLearningPathRow, PurchasedLearningPathStatKey } from '../../types';
import { PurchasedLearningPathStatTrigger } from './stat-trigger';

interface PurchasedLearningPathsTableProps {
  purchasedLearningPaths: PurchasedLearningPathRow[];
  page: number;
  pageSize: number;
  total: number;
  hasQuery?: boolean;
  isLoading?: boolean;
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
  onPageChange,
  onPageSizeChange,
  onStatClick,
  onAssign,
}: PurchasedLearningPathsTableProps) {
  const columns: DataTableColumn<PurchasedLearningPathRow>[] = [
    {
      key: 'name',
      label: 'Parcours de formation',
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
      isLoading={isLoading}
      hasQuery={hasQuery}
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
