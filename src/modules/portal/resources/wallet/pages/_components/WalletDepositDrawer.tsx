'use client';

import { useState } from 'react';
import { CreditCard, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface WalletDepositDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS = [
  {
    id: 'stripe',
    label: 'Stripe',
    icon: CreditCard,
    description:
      'Stripe est une passerelle de paiement autorisée pour les transactions par carte (crédit et débit).',
  },
  {
    id: 'bank_transfer',
    label: 'Virement Bancaire',
    icon: Building2,
    description:
      'Le virement bancaire est une méthode qui permet aux utilisateurs de payer directement depuis leur compte bancaire. Fournissez les preuves que vous effectuez le virement bancaire sur le compte indiqué.',
  },
] as const;

export function WalletDepositDrawer({ open, onOpenChange }: WalletDepositDrawerProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const amountValue = Number(amount || 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0" showCloseButton={true}>
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>Créditer mon portefeuille de points</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 p-6">
          {/* Montant */}
          <div className="space-y-2">
            <Label>Montant à créditer</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                step={10}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-14 mt-2 "
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                POINT
              </span>
            </div>
          </div>

          {/* Type de paiement */}
          <div className="space-y-3">
            <Label>Type de paiement </Label>
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-4 mt-2 text-left transition-colors',
                    isSelected
                      ? 'border-(--color-primary) bg-(--color-primary)/5'
                      : 'border-border bg-background hover:bg-muted/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      isSelected
                        ? 'bg-(--color-primary) text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{method.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-stretch sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-auto w-full text-foreground sm:w-[220px]"
            >
              Annuler
            </Button>
            <Button
              disabled={amountValue <= 0 || !selectedMethod}
              className="h-auto w-full whitespace-normal bg-(--color-primary) p-2 text-white hover:bg-(--color-primary) sm:w-[220px]"
            >
              <span className="flex items-center gap-2">
                {amountValue > 0 ? `Déposer ${amountValue} POINT` : 'Déposer'}
                <ArrowRight className="size-4" />
              </span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
