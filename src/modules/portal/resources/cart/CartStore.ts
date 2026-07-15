import { create } from 'zustand';
import { toast } from 'sonner';

const TAX_RATE = 0.2;
const INITIAL_WALLET_BALANCE = 32450;

export interface CartProduct {
  id: string;
  title: string;
  price: number;
  coverImage?: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CheckoutResult {
  success: boolean;
  reason?: 'empty' | 'insufficient-balance';
}

interface CartTotals {
  subtotal: number;
  taxes: number;
  total: number;
  cartCount: number;
}

interface CartState extends CartTotals {
  cartItems: CartItem[];
  walletBalance: number;
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  checkout: () => CheckoutResult;
}

function calculateTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = subtotal * TAX_RATE;
  const total = subtotal + taxes;
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, taxes, total, cartCount };
}

function withTotals(items: CartItem[]) {
  return {
    cartItems: items,
    ...calculateTotals(items),
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  walletBalance: INITIAL_WALLET_BALANCE,
  subtotal: 0,
  taxes: 0,
  total: 0,
  cartCount: 0,

  addToCart: (product) => {
    const { cartItems } = get();
    const alreadyInCart = cartItems.some((item) => item.id === product.id);

    if (alreadyInCart) {
      toast.info('Cette formation est déjà dans le panier.');
      return;
    }

    const nextItems = [...cartItems, { ...product, quantity: 1 }];
    set(withTotals(nextItems));
    toast.success('Formation ajoutée au panier.');
  },

  removeFromCart: (productId) => {
    const nextItems = get().cartItems.filter((item) => item.id !== productId);
    set(withTotals(nextItems));
  },

  increaseQuantity: (productId) => {
    const nextItems = get().cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
    );
    set(withTotals(nextItems));
  },

  decreaseQuantity: (productId) => {
    const nextItems = get()
      .cartItems.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
      )
      .filter((item) => item.quantity > 0);

    set(withTotals(nextItems));
  },

  clearCart: () => {
    set(withTotals([]));
  },

  checkout: () => {
    const { cartItems, total, walletBalance } = get();

    if (cartItems.length === 0) {
      toast.info('Votre panier est vide.');
      return { success: false, reason: 'empty' };
    }

    if (walletBalance < total) {
      toast.error('Solde insuffisant pour effectuer ce paiement.');
      return { success: false, reason: 'insufficient-balance' };
    }

    set({
      ...withTotals([]),
      walletBalance: walletBalance - total,
    });

    toast.success('Paiement effectué avec succès.');
    return { success: true };
  },
}));
