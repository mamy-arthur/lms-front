'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    description: 'Visa, Mastercard',
    iconBg: 'bg-(--color-primary)',
    iconColor: 'text-white',
    Icon: CreditCard,
  },
  // {
  //   value: 'bank_transfer',
  //   label: 'Virement bancaire',
  //   description: 'Transfert depuis votre banque',
  //   iconBg: 'bg-blue-100',
  //   iconColor: 'text-blue-600',
  //   Icon: Building2,
  // },
  // {
  //   value: 'cash',
  //   label: 'Espèces',
  //   description: 'Paiement en main propre',
  //   iconBg: 'bg-emerald-100',
  //   iconColor: 'text-emerald-600',
  //   Icon: Banknote,
  // },
];

interface CheckoutPaymentMethodProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  disabled: boolean;
}

export function CheckoutPaymentMethod({ value, onChange, disabled }: CheckoutPaymentMethodProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [useDifferentName, setUseDifferentName] = useState(false);
  const [billingName, setBillingName] = useState('');

  function handleCardNumber(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  }

  function handleExpiry(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  }

  function handleCvv(e: React.ChangeEvent<HTMLInputElement>) {
    setCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
  }

  return (
    <section>
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
                'flex w-full items-center gap-4 rounded-sm border p-4 text-left transition-all duration-150',
                isSelected
                  ? 'border-(--color-primary) bg-(--color-primary)/5'
                  : 'border-border bg-background hover:border-foreground/20 hover:bg-muted/30',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm',
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
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                  isSelected ? 'border-(--color-primary)' : 'border-muted-foreground/30',
                )}
              >
                {isSelected && <div className="h-2 w-2 rounded-full bg-(--color-primary)" />}
              </div>
            </button>
          );
        })}
      </div>

      {value === 'card' && (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="card-number" className="text-xs font-medium">
              Numéro de carte
            </Label>
            <div className="relative">
              <Input
                id="card-number"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={handleCardNumber}
                disabled={disabled}
                maxLength={19}
                inputMode="numeric"
                className="h-8 pr-20 text-xs"
              />
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1.5">
                {/* Visa */}
                <svg viewBox="0 0 48 16" className="h-4 w-auto" aria-label="Visa">
                  <rect width="45" height="16" rx="3" fill="#1A1F71" />
                  <text
                    x="24"
                    y="12"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="Arial, sans-serif"
                    letterSpacing="1"
                  >
                    VISA
                  </text>
                </svg>
                {/* Mastercard */}
                <svg viewBox="0 0 38 24" className="h-4 w-auto" aria-label="Mastercard">
                  <rect width="38" height="24" rx="3" fill="#252525" />
                  <circle cx="15" cy="12" r="7" fill="#EB001B" />
                  <circle cx="23" cy="12" r="7" fill="#F79E1B" />
                  <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" />
                </svg>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expiry" className="text-xs font-medium">
                Date d&apos;expiration
              </Label>
              <Input
                id="expiry"
                placeholder="MM/AA"
                value={expiry}
                onChange={handleExpiry}
                disabled={disabled}
                maxLength={5}
                inputMode="numeric"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cvv" className="text-xs font-medium">
                Code de sécurité
              </Label>
              <Input
                id="cvv"
                placeholder="CVV"
                value={cvv}
                onChange={handleCvv}
                disabled={disabled}
                maxLength={4}
                inputMode="numeric"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="different-name"
              checked={useDifferentName}
              onCheckedChange={(checked) => setUseDifferentName(checked === true)}
              disabled={disabled}
              className="shrink-0 data-checked:bg-(--color-primary) data-checked:border-(--color-primary)"
            />
            <Label
              htmlFor="different-name"
              className="cursor-pointer text-xs text-muted-foreground"
            >
              Utiliser un nom différent sur les factures
            </Label>
          </div>

          {useDifferentName && (
            <div className="space-y-1.5">
              <Label htmlFor="billing-name" className="text-xs">
                Facturer à
              </Label>
              <Input
                id="billing-name"
                placeholder="Nom sur la facture"
                value={billingName}
                onChange={(e) => setBillingName(e.target.value)}
                disabled={disabled}
                className="h-8 text-xs"
              />
            </div>

          )}

          <div className="flex items-start gap-2">
            <Checkbox
              id="accept-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              disabled={disabled}
              className="mt-0.5 shrink-0 data-checked:bg-(--color-primary) data-checked:border-(--color-primary)"
            />
            <Label htmlFor="accept-terms" className="cursor-pointer text-xs text-muted-foreground">
              Vous acceptez que Nacre Solution débite votre carte du montant indiqué ci-dessus
              maintenant, conformément à nos{' '}
              <a
                href="/conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                conditions
              </a>
              .
            </Label>
          </div>
        </div>
      )}
    </section>
  );
}
