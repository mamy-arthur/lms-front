import { Button } from '@/components/ui/button';
import {
  formatCartMoney,
  getCartItemCount,
  getCartSubtotal,
} from '@/modules/portal/resources/cart/cart-utils';
import type { ApiCart } from '@/shared/types/cart.types';

interface CartSummaryProps {
  cart: ApiCart;
}

export function CartSummary({ cart }: CartSummaryProps) {
  const cartCount = getCartItemCount(cart);
  const subtotal = getCartSubtotal(cart.items);
  const total = cart.total;
  const currency = cart.currency || 'EUR';

  return (
    <div className="space-y-3 pt-4 bg-gray-50 p-4 rounded-lg">
      <div className="flex  justify-between items-center gap-2 space-y-1">
        <p className="text-sm font-semibold text-foreground">Resumé de la commande</p>
        <p className="text-xs text-muted-foreground">
          {cartCount} article{cartCount > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Sous-total</span>
        <span className="font-medium">{formatCartMoney(subtotal, currency)}</span>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Total</span>
        <span className="font-semibold">{formatCartMoney(total, currency)}</span>
      </div>

      <Button
        type="button"
        className="w-full bg-(--color-primary) hover:bg-(--color-primary)/80"
        disabled
      >
        Payer
      </Button>
    </div>
  );
}
