import type { ApiCart, ApiCartItem } from '@/shared/types/cart.types';

export function getCartItemCount(cart: ApiCart | undefined | null): number {
  if (!cart?.items?.length) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(items: ApiCartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function findCartItemByLearningPath(
  cart: ApiCart | undefined | null,
  learningPathId: string,
): ApiCartItem | undefined {
  return cart?.items.find((item) => item.learning_path_id === learningPathId);
}

export function getCartItemCoverImage(item: ApiCartItem): string | undefined {
  if (typeof item.image === 'string') {
    return item.image;
  }
  if (item.image && typeof item.image === 'object' && typeof item.image.url === 'string') {
    return item.image.url;
  }
  return undefined;
}

/** Met à jour (ou retire) un item du panier et recalcule le total. */
export function withCartItemQuantity(
  cart: ApiCart,
  cartItemId: string,
  nextQuantity: number,
  itemSnapshot: ApiCartItem,
): ApiCart {
  const exists = cart.items.some((item) => item.id === cartItemId);
  let items: ApiCartItem[];

  if (nextQuantity <= 0) {
    items = cart.items.filter((item) => item.id !== cartItemId);
  } else if (exists) {
    items = cart.items.map((item) =>
      item.id === cartItemId ? { ...item, quantity: nextQuantity } : item,
    );
  } else {
    items = [...cart.items, { ...itemSnapshot, quantity: nextQuantity }];
  }

  return {
    ...cart,
    items,
    total: getCartSubtotal(items),
  };
}

export function formatCartMoney(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
