'use client';

import { useState } from 'react';
import { InvoicesTable } from './InvoicesTable';
import { InvoicePreviewDrawer } from './InvoicePreviewDrawer';
import type { InvoiceBase } from '@/modules/shared/lib/wallet-types';
import type { DataTableColumn } from '@/shared/components/ui/DataTable';
import { useRequestStore } from '@/modules/shared/lib/request-store';

interface InvoiceTabContentProps<T extends InvoiceBase> {
  invoices: T[];
  clientColumn: DataTableColumn<T>;
  readonly?: boolean;
}

export function InvoiceTabContent<T extends InvoiceBase>({
  invoices,
  clientColumn,
  readonly = true,
}: InvoiceTabContentProps<T>) {
  const [previewInvoice, setPreviewInvoice] = useState<T | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const requests = useRequestStore((s) => s.requests);
  const getRequest = useRequestStore((s) => s.getRequest);

  const handlePreview = (invoice: T) => {
    setPreviewInvoice(invoice);
    setDrawerOpen(true);
  };

  const previewRequest = previewInvoice ? (getRequest(previewInvoice.ref) ?? null) : null;

  return (
    <div className="space-y-4">
      <InvoicesTable
        data={invoices}
        onPreview={handlePreview}
        clientColumn={clientColumn}
        requests={requests}
      />
      <InvoicePreviewDrawer
        invoice={previewInvoice}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        request={previewRequest}
        readonly={readonly}
      />
    </div>
  );
}
