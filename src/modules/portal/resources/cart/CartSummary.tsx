import { Button } from '@/components/ui/button';
import { useCartStore } from '@/modules/portal/resources/cart/CartStore';
import { formatCurrency } from '@/modules/shared/lib/wallet-utils';

interface CartSummaryProps {
  onPaid?: () => void;
}

export function CartSummary({ onPaid }: CartSummaryProps) {
  const subtotal = useCartStore((state) => state.subtotal);
  const taxes = useCartStore((state) => state.taxes);
  const total = useCartStore((state) => state.total);
  const walletBalance = useCartStore((state) => state.walletBalance);
  const cartCount = useCartStore((state) => state.cartCount);
  const checkout = useCartStore((state) => state.checkout);

  const handleCheckout = () => {
    const result = checkout();
    if (result.success) {
      onPaid?.();
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sous-total</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Taxes (20%)</span>
        <span className="font-medium">{formatCurrency(taxes)}</span>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Total TTC</span>
        <span className="font-semibold">{formatCurrency(total)}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Solde disponible</span>
        <span>{formatCurrency(walletBalance)}</span>
      </div>

      <Button
        type="button"
        className="w-full bg-(--color-primary) hover:bg-(--color-primary)/80"
        disabled={cartCount === 0}
        onClick={handleCheckout}
      >
        Payer
      </Button>
    </div>
  );
}
