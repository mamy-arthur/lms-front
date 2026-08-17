'use client';

import { Lock, ImageIcon } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { formatCartMoney, getCartItemCoverImage } from '@/modules/portal/resources/cart/cart-utils';
import type { ApiCartItem } from '@/shared/types/cart.types';

interface CheckoutOrderSummaryProps {
  cartItems: ApiCartItem[];
  cartCount: number;
  subtotal: number;
  total: number;
  currency: string;
  discount: number;
}

export function CheckoutOrderSummary({
  cartItems,
  cartCount,
  subtotal,
  total,
  currency,
  discount,
}: CheckoutOrderSummaryProps) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-xs font-semibold">Récapitulatif de la commande</h2>

        <div className="space-y-4">
          {cartItems.map((item) => {
            const coverImage = getCartItemCoverImage(item);
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className="h-15 w-15 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {coverImage ? (
                    <img src={coverImage} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                      <ImageIcon className="size-4" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-medium text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.quantity} × {formatCartMoney(item.price, currency)}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold">
                  {formatCartMoney(item.price * item.quantity, currency)}
                </p>
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Sous-total ({cartCount} article{cartCount > 1 ? 's' : ''})
            </span>
            <span className="font-medium">{formatCartMoney(subtotal, currency)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span>Réduction</span>
              <span className="font-medium">−{formatCartMoney(discount, currency)}</span>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Total</span>
          <span className="text-sm font-bold text-(--color-primary)">
            {formatCartMoney(total, currency)}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3 shrink-0" />
          <span>Paiement 100 % sécurisé</span>
        </div>
      </div>
    </aside>
  );
}
