export type CartStatus = 'active' | 'abandoned' | 'converted';

export interface ApiCartItem {
  id: string;
  cart_id: string;
  learning_path_id: string;
  name: string;
  /**
   * Image renvoyée par l'API panier.
   * Selon la version backend, peut être une URL directe
   * ou un objet `{ url }`.
   */
  image?: string | { url?: string | null } | null;
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

export interface UpdateCartItemPayload {
  quantity: number;
}
