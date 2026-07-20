'use client';

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/modules/shared/lib/wallet-utils';
import type { WalletTransaction } from '@/modules/shared/lib/wallet-types';

interface WalletTransactionsTableProps {
  data: WalletTransaction[];
  sort?: DataTableSort;
  page: number;
  pageSize: number;
  total: number;
  hasQuery: boolean;
  isLoading?: boolean;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function WalletTransactionsTable({
  data,
  sort,
  page,
  pageSize,
  total,
  hasQuery,
  isLoading,
  onSort,
  onPageChange,
  onPageSizeChange,
}: WalletTransactionsTableProps) {
  const cellClassName = 'py-1 text-xs text-muted-foreground';

  const columns: DataTableColumn<WalletTransaction>[] = [
    {
      key: 'date',
      label: 'Date / Heure',
      sortable: true,
      render: (row) => (
        <div className="py-1 text-xs font-medium inline-flex items-center text-foreground">
          {formatDateTime(row.date)}
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Utilisateur',
      sortable: true,
      render: (row) => <div className={cellClassName}>{row.user}</div>,
    },
    {
      key: 'category',
      label: 'Catégorie',
      sortable: true,
      render: (row) => <div className={cellClassName}>{row.category}</div>,
    },
    {
      key: 'type',
      label: 'Type de transaction',
      sortable: true,
      headerClassName: 'whitespace-normal',
      render: (row) => (
        <div className="py-1">
          <Badge
            className={row.type === 'Crédit' ? 'text-green-400' : 'text-red-400'}
            variant={'outline'}
          >
            {row.type}
          </Badge>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (row) => (
        <div className={cellClassName}>
          {row.type === 'Crédit' ? '+' : '-'}
          {Math.abs(row.amount)} pts
        </div>
      ),
    },
    {
      key: 'balanceBefore',
      label: 'Solde avant',
      sortable: true,
      render: (row) => <div className={cellClassName}>{row.balanceBefore} pts</div>,
    },
    {
      key: 'balanceAfter',
      label: 'Solde après',
      sortable: true,
      render: (row) => <div className={cellClassName}>{row.balanceAfter} pts</div>,
    },
    {
      key: 'nonRefundable',
      label: 'Non remboursable',
      sortable: true,
      headerClassName: 'whitespace-normal',
      render: (row) => <div className={cellClassName}>{row.nonRefundable}</div>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => <div className={cellClassName}>{row.description}</div>,
    },
  ];

  return (
    <DataTable
      data={data}
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
      emptyState={{
        title: 'Aucune transaction trouvée',
        description:
          'Changez vos filtres ou recherchez un autre terme pour afficher des résultats.',
      }}
    />
  );
}
