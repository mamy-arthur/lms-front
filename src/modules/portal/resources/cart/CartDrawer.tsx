import { ShoppingCart } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CartItem } from '@/modules/portal/resources/cart/CartItem';
import { CartSummary } from '@/modules/portal/resources/cart/CartSummary';
import { useCartStore } from '@/modules/portal/resources/cart/CartStore';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const cartItems = useCartStore((state) => state.cartItems);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full! max-w-270!">
        <SheetHeader className="border-b border-border px-4 py-4 sm:px-6">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-4" />
            Votre panier
          </SheetTitle>
          <SheetDescription>Consultez les formations ajoutées à votre panier.</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Panier vide</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ajoutez des formations pour commencer.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden py-2">
              <div className="grid h-full min-h-0 grid-cols-1 gap-2 lg:grid-cols-3">
                <div className="min-h-0 overflow-y-auto space-y-2 lg:col-span-2">
                  {cartItems.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>

                <div className="lg:col-span-1 lg:sticky lg:top-0 lg:self-start">
                  <CartSummary onPaid={() => onOpenChange(false)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
