import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatCartMoney,
  getCartItemCount,
  getCartSubtotal,
} from '@/modules/portal/resources/cart/cart-utils';
import { useCreateOrder } from '@/modules/portal/resources/cart/hooks/useCreateOrder';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { ApiCart } from '@/shared/types/cart.types';
import type { PaymentMethod } from '@/shared/types/order.types';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  card: 'Carte bancaire',
  bank_transfer: 'Virement bancaire',
};

interface CartSummaryProps {
  cart: ApiCart;
}

export function CartSummary({ cart }: CartSummaryProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const createOrder = useCreateOrder();
  const cartCount = getCartItemCount(cart);
  const subtotal = getCartSubtotal(cart.items);
  const total = cart.total;
  const currency = cart.currency || 'EUR';
  const isSubmitting = createOrder.isPending;

  const handleConfirmPayment = async () => {
    try {
      await createOrder.mutateAsync({ payment_method: paymentMethod });
      setConfirmOpen(false);
      toast.success('Commande validée avec succès.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de valider la commande.'));
    }
  };

  return (
    <>
      <div className="space-y-3 pt-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center gap-2 space-y-1">
          <p className="text-sm font-semibold text-foreground">Résumé de la commande</p>
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

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Mode de paiement</p>
          <Select
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full" size="default">
              <SelectValue placeholder="Sélectionner un mode de paiement" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <SelectItem key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          className="w-full bg-(--color-primary) hover:bg-(--color-primary)/80"
          disabled={isSubmitting}
          onClick={() => setConfirmOpen(true)}
        >
          {isSubmitting ? 'Paiement en cours...' : 'Payer'}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement</AlertDialogTitle>
            <AlertDialogDescription>
              {`Cette action va créer la commande avec le mode de paiement « ${PAYMENT_METHOD_LABELS[paymentMethod]} ».`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <Button
              type="button"
              className="bg-(--color-primary) hover:bg-(--color-primary)/80"
              disabled={isSubmitting}
              onClick={handleConfirmPayment}
            >
              {isSubmitting ? 'Validation...' : 'Confirmer'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
