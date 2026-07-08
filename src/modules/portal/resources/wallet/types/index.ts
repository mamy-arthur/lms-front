import type { InvoiceBase } from '@/modules/shared/lib/wallet-types';

export interface ClientInvoice extends InvoiceBase {
  tenant: string;
}
