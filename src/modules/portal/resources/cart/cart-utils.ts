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

export function formatCartMoney(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
