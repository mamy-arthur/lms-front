'use client';

import { CreditCard, Building2, Banknote } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { PaymentMethod } from '@/shared/types/order.types';

type PaymentMethodOption = {
  value: PaymentMethod;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    value: 'card',
    label: 'Carte bancaire',
    description: 'Visa, Mastercard…',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    Icon: CreditCard,
  },
  {
    value: 'bank_transfer',
    label: 'Virement bancaire',
    description: 'Transfert depuis votre banque',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    Icon: Building2,
  },
  {
    value: 'cash',
    label: 'Espèces',
    description: 'Paiement en main propre',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    Icon: Banknote,
  },
];

interface CheckoutPaymentMethodProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  disabled: boolean;
}

export function CheckoutPaymentMethod({ value, onChange, disabled }: CheckoutPaymentMethodProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-xs font-semibold">Mode de paiement</h2>
      <div className="space-y-2">
        {PAYMENT_METHODS.map(({ value: method, label, description, iconBg, iconColor, Icon }) => {
          const isSelected = value === method;
          return (
            <button
              key={method}
              type="button"
              disabled={disabled}
              onClick={() => onChange(method)}
              className={cn(
                'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all duration-150',
                isSelected
                  ? 'border-(--color-primary) bg-(--color-primary)/5 ring-1 ring-(--color-primary)'
                  : 'border-border bg-background hover:border-foreground/20 hover:bg-muted/30',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  iconBg,
                )}
              >
                <Icon className={cn('size-4', iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isSelected ? 'text-(--color-primary)' : 'text-foreground',
                  )}
                >
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isSelected ? 'border-(--color-primary)' : 'border-muted-foreground/30',
                )}
              >
                {isSelected && <div className="h-2 w-2 rounded-full bg-(--color-primary)" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
