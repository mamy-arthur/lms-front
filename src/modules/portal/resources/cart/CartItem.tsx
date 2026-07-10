import { Minus, Plus, Trash2, ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useCartStore, type CartItem as CartLineItem } from '@/modules/portal/resources/cart/CartStore';
import { formatCurrency } from '@/modules/shared/lib/wallet-utils';

interface CartItemProps {
  item: CartLineItem;
}

export function CartItem({ item }: CartItemProps) {
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);

  return (
    <div className="rounded-lg border border-border p-3 sm:p-4">
      <div className="flex gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
          {item.coverImage ? (
            <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="size-5" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prix unitaire: {formatCurrency(item.price)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-md border border-border p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => decreaseQuantity(item.id)}
            aria-label="Diminuer la quantité"
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => increaseQuantity(item.id)}
            aria-label="Augmenter la quantité"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <p className="text-sm font-medium">Sous-total: {formatCurrency(item.price * item.quantity)}</p>
      </div>

      <div className="mt-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-destructive hover:text-destructive"
          onClick={() => removeFromCart(item.id)}
        >
          <Trash2 className="mr-1 size-3.5" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
