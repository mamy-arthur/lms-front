import type { ClientInvoice } from '@/modules/portal/resources/wallet/types';
import { baseInvoices } from '@/modules/shared/lib/wallet-mock-data';

export const invoices: ClientInvoice[] = baseInvoices.map((inv) => ({
  ...inv,
  tenant: 'Learneo SARL',
}));
