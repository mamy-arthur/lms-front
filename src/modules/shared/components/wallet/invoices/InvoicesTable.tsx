'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, CircleAlert, CircleCheck, CircleX, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/modules/shared/lib/wallet-utils';
import type { InvoiceBase, InvoiceRequest, RequestStatus } from '@/modules/shared/lib/wallet-types';
import { REQUEST_STATUS_CONFIG } from '@/modules/shared/lib/wallet-types';

interface InvoicesTableProps<T extends InvoiceBase> {
  data: T[];
  onPreview: (invoice: T) => void;
  clientColumn: DataTableColumn<T>;
  requests?: Record<string, InvoiceRequest>;
}

export function InvoicesTable<T extends InvoiceBase>({
  data,
  onPreview,
  clientColumn,
  requests,
}: InvoicesTableProps<T>) {
  const [sort, setSort] = useState<DataTableSort>({ column: 'date', direction: 'desc' });

  const handleSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
  }, []);

  const pageSize = useMemo(() => Math.max(data.length, 25), [data.length]);

  const statusIcons: Record<RequestStatus, React.ReactNode> = {
    pending: (
      <CircleAlert className={`size-3.5 shrink-0 ${REQUEST_STATUS_CONFIG.pending.iconColor}`} />
    ),
    accepted: (
      <CircleCheck className={`size-3.5 shrink-0 ${REQUEST_STATUS_CONFIG.accepted.iconColor}`} />
    ),
    rejected: (
      <CircleX className={`size-3.5 shrink-0 ${REQUEST_STATUS_CONFIG.rejected.iconColor}`} />
    ),
  };

  const statusTooltipByRequest: Record<RequestStatus, string> = {
    pending: 'Demande en attente',
    accepted: 'Demande acceptée',
    rejected: 'Demande refusée',
  };

  const statusMeta = (ref: string) => {
    const req = requests?.[ref];
    if (!req) {
      return {
        icon: <FileText className="size-3.5 shrink-0 text-muted-foreground" />,
        tooltip: 'Facture',
      };
    }

    return {
      icon: statusIcons[req.status],
      tooltip: statusTooltipByRequest[req.status],
    };
  };

  const columns: DataTableColumn<T>[] = [
    {
      key: 'ref',
      label: 'Réf.',
      sortable: true,
      render: (row) => {
        const status = statusMeta(row.ref);

        return (
          <div className="text-xs font-medium text-foreground inline-flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center">{status.icon}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{status.tooltip}</p>
              </TooltipContent>
            </Tooltip>
            {row.ref}
          </div>
        );
      },
    },
    {
      key: 'date',
      label: 'Date facturation',
      sortable: true,
      render: (row) => <div className="text-xs text-muted-foreground">{formatDate(row.date)}</div>,
    },
    {
      key: 'amountHT',
      label: 'Montant HT',
      sortable: true,
      render: (row) => (
        <div className="text-xs text-muted-foreground">{formatCurrency(row.amountHT)}</div>
      ),
    },
    {
      key: 'amountTTC',
      label: 'Montant TTC',
      sortable: true,
      render: (row) => (
        <div className="text-xs text-muted-foreground">{formatCurrency(row.amountTTC)}</div>
      ),
    },
    {
      key: 'transactionFees',
      label: 'Frais de transaction',
      headerClassName: 'max-w-25 whitespace-normal',
      sortable: true,
      render: (row) => (
        <div className="text-xs text-muted-foreground">{formatCurrency(row.transactionFees)}</div>
      ),
    },
    clientColumn,
    {
      key: 'paymentMethod',
      label: 'Type de paiement',
      sortable: true,
      render: (row) => <div className="text-xs text-muted-foreground">{row.paymentMethod}</div>,
    },
    {
      key: 'type',
      label: 'Type de facture',
      sortable: true,
      render: (row) => <div className="text-xs text-muted-foreground">{row.type}</div>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="size-7 text-muted-foreground text-(--color-primary)"
            onClick={(e) => {
              e.stopPropagation();
              window.open(row.pdfUrl, '_blank');
            }}
            title="Télécharger"
          >
            <Download className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      sort={sort}
      onSort={handleSort}
      page={0}
      pageSize={pageSize}
      total={data.length}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      emptyState={{
        title: 'Aucune facture trouvée',
        description: "Aucune facture n'est disponible pour le moment.",
      }}
      onRowClick={onPreview}
    />
  );
}
