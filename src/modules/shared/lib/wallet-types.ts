export type WalletTransactionType = 'Crédit' | 'Débit';

export type PaymentMethod = 'Stripe' | 'Virement Bancaire';

export type InvoiceType = 'Facture' | 'Avoir' | 'Proforma' | 'Note de crédit';

export interface InvoiceBase {
  id: string;
  ref: string;
  date: string;
  amountHT: number;
  amountTTC: number;
  transactionFees: number;
  paymentMethod: PaymentMethod;
  type: InvoiceType;
  pdfUrl: string;
}

export interface InvoiceParty {
  id?: string;
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePaymentMethod {
  label: string;
  amount: number;
}

export interface InvoiceDetail extends Pick<
  InvoiceBase,
  'id' | 'ref' | 'date' | 'amountHT' | 'amountTTC' | 'type' | 'pdfUrl'
> {
  seller: InvoiceParty;
  buyer: InvoiceParty;
  items: InvoiceLineItem[];
  paymentMethods: InvoicePaymentMethod[];
}

export interface WalletRecipient {
  id: string;
  name: string;
  email: string;
  balance: number;
  nonRefundableBalance: number;
}

export interface WalletTransaction {
  id: string;
  user: string;
  date: string;
  category: string;
  amount: number;
  type: WalletTransactionType;
  balanceBefore: number;
  balanceAfter: number;
  nonRefundable: number;
  description: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface RequestStatusConfig {
  label: string;
  badgeVariant: 'default' | 'destructive' | 'outline';
  badgeClassName?: string;
  iconColor: string;
}

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, RequestStatusConfig> = {
  pending: {
    label: 'En attente',
    badgeVariant: 'outline',
    badgeClassName: 'text-orange-600 border-orange-200 bg-orange-50',
    iconColor: 'text-orange-500',
  },
  accepted: {
    label: 'Acceptée',
    badgeVariant: 'default',
    badgeClassName: 'bg-(--color-primary) hover:bg-(--color-primary)/80',
    iconColor: 'text-(--color-primary)',
  },
  rejected: {
    label: 'Rejetée',
    badgeVariant: 'destructive',
    iconColor: 'text-red-500',
  },
};

export interface InvoiceRequest {
  invoiceRef: string;
  type: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  tenantResponse?: string;
}

export interface WalletTransactionSearchParams {
  q?: string;
  category?: string;
  type?: string;
  refundable?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
