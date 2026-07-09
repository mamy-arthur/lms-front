'use client';

import { formatCurrency } from '@/modules/shared/lib/wallet-utils';
import type { InvoiceLineItem } from '@/modules/shared/lib/wallet-types';

interface InvoiceDetailsTableProps {
  items: InvoiceLineItem[];
  variant?: 'drawer' | 'dialog';
  emptyMessage?: string;
}

export function InvoiceDetailsTable({
  items,
  variant = 'drawer',
  emptyMessage = 'Aucun détail disponible',
}: InvoiceDetailsTableProps) {
  const isDrawer = variant === 'drawer';

  return (
    <div className={isDrawer ? 'overflow-hidden rounded-md border border-border' : undefined}>
      <table className="w-full text-xs">
        <thead>
          <tr
            className={
              isDrawer
                ? 'bg-muted text-muted-foreground uppercase tracking-wide text-xs'
                : 'border-b text-muted-foreground'
            }
          >
            <th
              className={
                isDrawer
                  ? 'px-4 py-2 text-left font-medium'
                  : 'pb-2 text-left font-medium uppercase tracking-wide'
              }
            >
              Description
            </th>
            <th
              className={
                isDrawer
                  ? 'px-4 py-2 text-left font-medium'
                  : 'pb-2 text-left font-medium uppercase tracking-wide'
              }
            >
              Quantité
            </th>
            <th
              className={
                isDrawer
                  ? 'px-4 py-2 text-left font-medium'
                  : 'pb-2 text-left font-medium uppercase tracking-wide'
              }
            >
              Prix unitaire
            </th>
            <th
              className={
                isDrawer
                  ? 'px-4 py-2 text-left font-medium'
                  : 'pb-2 text-left font-medium uppercase tracking-wide'
              }
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr
                key={`${item.description}-${index}`}
                className={
                  isDrawer
                    ? 'border-t border-border bg-background'
                    : 'border-b last:border-0 text-xs text-muted-foreground'
                }
              >
                <td className={isDrawer ? 'px-4 py-3' : 'py-1.5'}>{item.description}</td>
                <td className={isDrawer ? 'px-4 py-3' : 'py-1.5'}>{item.quantity}</td>
                <td className={isDrawer ? 'px-4 py-3' : 'py-1.5'}>
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className={isDrawer ? 'px-4 py-3' : 'py-1.5'}>{formatCurrency(item.total)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                className={
                  isDrawer
                    ? 'px-4 py-3 text-center text-muted-foreground'
                    : 'py-2 text-center text-muted-foreground'
                }
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
