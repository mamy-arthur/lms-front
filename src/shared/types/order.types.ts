export type PaymentMethod = 'card' | 'bank_transfer' | 'cash';

export interface CreateOrderPayload {
  payment_method: PaymentMethod;
}

/** Réponse minimale renvoyée par POST /orders. */
export interface ApiOrder {
  id: string;
  payment_method: PaymentMethod;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiOrderResponse {
  data: ApiOrder;
}
