import type { InvoiceBase } from '@/modules/shared/lib/wallet-types';

export interface Invoice extends InvoiceBase {
  client: string;
}
