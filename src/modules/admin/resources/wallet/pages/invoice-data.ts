import type { Invoice } from '@/modules/admin/resources/wallet/types';
import { baseInvoices } from '@/modules/shared/lib/wallet-mock-data';

const clientMap: Record<string, string> = {
  'inv-001': 'Camille Dupont',
  'inv-002': 'Lucas Martin',
  'inv-003': 'Sofia Moreau',
  'inv-004': 'Camille Dupont',
  'inv-005': 'Lucas Martin',
  'inv-006': 'Sofia Moreau',
};

export const invoices: Invoice[] = baseInvoices.map((inv) => ({
  ...inv,
  client: clientMap[inv.id] ?? 'Unknown',
}));
