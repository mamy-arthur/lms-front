import { Trash2, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  formatCartMoney,
  getCartItemCoverImage,
} from '@/modules/portal/resources/cart/cart-utils';
import { useCartActions } from '@/modules/portal/resources/cart/hooks/useCartActions';
import { CartQuantityControls } from '@/modules/shared/components/store/CartQuantityControls';
import type { ApiCartItem } from '@/shared/types/cart.types';

interface CartItemProps {
  item: ApiCartItem;
}

export function CartItem({ item }: CartItemProps) {
  const { increase, decrease, remove, setQuantity, isMutatingFor } = useCartActions();
  const isMutating = isMutatingFor({ cartItemId: item.id });
  const coverImage = getCartItemCoverImage(item);

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg bg-gray-50 p-4">
      <div className="flex gap-3">
        <div className="h-18 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          {coverImage ? (
            <img src={coverImage} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="size-5" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prix unitaire: {formatCartMoney(item.price, item.currency)}
          </p>
        </div>
      </div>

      <CartQuantityControls
        quantity={item.quantity}
        onDecrease={() => decrease(item.id)}
        onIncrease={() => increase(item.id)}
        onQuantityChange={(quantity) => setQuantity(item.id, quantity)}
        disabled={isMutating}
      />
      <div>
        <p className="text-xs font-medium">
          Sous-total: {formatCartMoney(item.price * item.quantity, item.currency)}
        </p>
      </div>
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-destructive hover:text-destructive"
          onClick={() => remove(item.id)}
          disabled={isMutating}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
