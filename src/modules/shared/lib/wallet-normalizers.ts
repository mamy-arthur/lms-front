import type {
  InvoiceDetail,
  InvoiceLineItem,
  InvoiceParty,
  InvoicePaymentMethod,
} from './wallet-types';

type UnknownRecord = Record<string, unknown>;

export type InvoiceDetailDTO = UnknownRecord;

function normalizeParty(raw: unknown): InvoiceParty {
  const data = raw && typeof raw === 'object' ? (raw as UnknownRecord) : {};

  return {
    id: data.id ? String(data.id) : undefined,
    name: String(data.name ?? data.full_name ?? ''),
    address: String(data.address ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
  };
}

function normalizeItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item) => {
    const data = item && typeof item === 'object' ? (item as UnknownRecord) : {};

    return {
      description: String(data.description ?? ''),
      quantity: Number(data.quantity ?? 0),
      unitPrice: Number(data.unitPrice ?? data.unit_price ?? 0),
      total: Number(data.total ?? 0),
    };
  });
}

function normalizePaymentMethods(raw: unknown): InvoicePaymentMethod[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((method) => {
    const data = method && typeof method === 'object' ? (method as UnknownRecord) : {};

    return {
      label: String(data.label ?? ''),
      amount: Number(data.amount ?? 0),
    };
  });
}

export function normalizeInvoiceDetail(raw: InvoiceDetailDTO): InvoiceDetail {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    ref: String(raw.ref ?? raw.reference ?? ''),
    date: String(raw.date ?? ''),
    type: String(raw.type ?? 'Facture') as InvoiceDetail['type'],
    pdfUrl: String(raw.pdfUrl ?? raw.pdf_url ?? '#'),
    seller: normalizeParty(raw.seller),
    buyer: normalizeParty(raw.buyer),
    items: normalizeItems(raw.items),
    amountHT: Number(raw.amountHT ?? raw.amount_ht ?? 0),
    amountTTC: Number(raw.amountTTC ?? raw.amount_ttc ?? 0),
    paymentMethods: normalizePaymentMethods(raw.paymentMethods ?? raw.payment_methods),
  };
}
