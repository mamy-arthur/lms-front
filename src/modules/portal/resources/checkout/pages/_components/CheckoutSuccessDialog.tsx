'use client';

import { CheckCircle2, BookOpen } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCartMoney } from '@/modules/portal/resources/cart/cart-utils';

interface CheckoutSuccessDialogProps {
  open: boolean;
  paidTotal: number;
  paidCurrency: string;
  onNavigate: () => void;
}

export function CheckoutSuccessDialog({
  open,
  paidTotal,
  paidCurrency,
  onNavigate,
}: CheckoutSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onNavigate()}>
      <DialogContent
        className="max-w-sm text-center"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Paiement réussi</DialogTitle>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--color-primary)/10">
            <CheckCircle2 className="size-8 text-(--color-primary)" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Paiement réussi !</h2>
            <p className="text-sm text-muted-foreground">Votre commande a bien été enregistrée.</p>
          </div>
          <p className="text-2xl font-bold text-(--color-primary)">
            {formatCartMoney(paidTotal, paidCurrency)}
          </p>
          <p className="text-xs text-muted-foreground">
            Vous avez maintenant accès à vos formations.
          </p>
          <Button
            className="w-full bg-(--color-primary) hover:bg-(--color-primary)/80"
            onClick={onNavigate}
          >
            <BookOpen className="mr-2 size-4" />
            Accéder à mes formations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
