export type CartStatus = 'active' | 'abandoned' | 'converted';

export interface ApiCartItem {
  id: string;
  cart_id: string;
  learning_path_id: string;
  name: string;
  price: number;
  quantity: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ApiCart {
  id: string;
  tenant_id: string;
  user_id: string;
  status: CartStatus;
  currency: string;
  total: number;
  items: ApiCartItem[];
  created_at: string;
  updated_at: string;
}

export interface ApiCartResponse {
  data: ApiCart;
}

export interface AddCartItemPayload {
  learning_path_id: string;
}

/** Uniquement `1` (incrément) ou `-1` (décrément) — contrainte backend. */
export type CartItemQuantityDelta = 1 | -1;

export interface UpdateCartItemPayload {
  delta: CartItemQuantityDelta;
}
