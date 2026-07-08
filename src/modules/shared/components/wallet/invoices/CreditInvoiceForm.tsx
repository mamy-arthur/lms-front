'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { InvoiceDetail } from '@/modules/shared/lib/wallet-types';

interface CreditInvoiceFormProps {
  detail: InvoiceDetail;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  readonly?: boolean;
  onCancel?: () => void;
  onValidate?: () => void;
}

const formatPoints = (value: number) => new Intl.NumberFormat('fr-FR').format(value) + ' pts';

export function CreditInvoiceForm({
  detail,
  quantity,
  onQuantityChange,
  readonly = false,
  onCancel,
  onValidate,
}: CreditInvoiceFormProps) {
  const item = detail.items[0];

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-(--color-primary)">Avoir</p>
          <p className="mt-1 text-lg font-bold text-foreground">{detail.ref}</p>
        </div>
        <div className="space-y-1.5 text-right text-xs">
          <p>
            <span className="font-semibold">Date :</span> {detail.date}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-xs shadow-sm">
          <p className="font-semibold text-xs">Société Vendeur</p>
          <Separator />
          <p>
            <span className="font-semibold">Nom :</span> {detail.seller.name}
          </p>
          <p>
            <span className="font-semibold">Adresse :</span> {detail.seller.address}
          </p>
          <p>
            <span className="font-semibold">E-mail :</span> {detail.seller.email}
          </p>
          <p>
            <span className="font-semibold">Téléphone :</span> {detail.seller.phone}
          </p>
        </div>

        <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-xs shadow-sm">
          <p className="font-semibold text-xs">Facturé à</p>
          <Separator />
          <p>
            <span className="font-semibold">Nom :</span> {detail.buyer.name}
          </p>
          <p>
            <span className="font-semibold">Adresse :</span> {detail.buyer.address}
          </p>
          <p>
            <span className="font-semibold">E-mail :</span> {detail.buyer.email}
          </p>
          <p>
            <span className="font-semibold">Téléphone :</span> {detail.buyer.phone}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold">Détails de l'avoir</p>
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">{item.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Prix unitaire</p>
                <p className="text-xs font-medium">{formatPoints(item.unitPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Quantité</p>
                {readonly ? (
                  <p className="text-xs font-medium text-foreground">{quantity}</p>
                ) : (
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => onQuantityChange(Number(e.target.value))}
                    className="h-8 w-20 text-xs text-right"
                  />
                )}
              </div>
              <div className="w-24 text-right">
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="text-xs font-semibold text-(--color-primary)">
                  {formatPoints(item.unitPrice * quantity)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!readonly && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/90"
            onClick={onValidate}
          >
            Valider l'avoir
          </Button>
        </div>
      )}
    </div>
  );
}
