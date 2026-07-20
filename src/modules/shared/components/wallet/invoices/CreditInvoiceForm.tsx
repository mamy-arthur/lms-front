'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { InvoiceParty } from '@/modules/shared/lib/wallet-types';

export interface CreditNoteFormData {
  ref: string;
  date: string;
  client: string;
  motif: string;
  coursesCount: number;
  amountEur: number;
}

interface CreditInvoiceFormProps {
  invoiceRef: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  readonly?: boolean;
  onCancel?: () => void;
  onValidate?: (data: CreditNoteFormData) => void;
  onViewLinkedInvoice?: (ref: string) => void;
}

const formatEur = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);

function generateAvoirRef() {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900 + 100);
  return `AVOIR-${year}-${seq}`;
}

export function CreditInvoiceForm({
  invoiceRef,
  seller,
  buyer,
  readonly = false,
  onCancel,
  onValidate,
  onViewLinkedInvoice,
}: CreditInvoiceFormProps) {
  const today = new Date().toLocaleDateString('fr-FR');
  const [ref] = useState(() => generateAvoirRef());
  const [motif, setMotif] = useState('');
  const [coursesCount, setCoursesCount] = useState(1);
  const [amountEur, setAmountEur] = useState<number | ''>('');

  const canValidate = motif.trim().length > 0 && coursesCount > 0 && Number(amountEur) > 0;

  const handleValidate = () => {
    if (!canValidate) return;
    onValidate?.({
      ref,
      date: today,
      client: buyer.name,
      motif: motif.trim(),
      coursesCount,
      amountEur: Number(amountEur),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-(--color-primary)">Création d'avoir</p>
          <p className="mt-1 text-lg font-bold text-foreground">{ref}</p>
        </div>
        <div className="space-y-1 text-right text-xs text-muted-foreground">
          <p>
            <span className="font-semibold">Date d'émission :</span> {today}
          </p>
          <p>
            <span className="font-semibold">Facture liée : </span>
            {onViewLinkedInvoice ? (
              <button
                type="button"
                onClick={() => onViewLinkedInvoice(invoiceRef)}
                className="font-semibold text-(--color-primary) underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                {invoiceRef}
              </button>
            ) : (
              <span className="font-semibold">{invoiceRef}</span>
            )}
          </p>
        </div>
      </div>

      <Separator />

      {/* Seller + Buyer */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-xs shadow-sm">
          <p className="font-semibold">Société Vendeur</p>
          <Separator />
          <p>
            <span className="font-semibold">Nom :</span> {seller.name}
          </p>
          <p>
            <span className="font-semibold">Adresse :</span> {seller.address}
          </p>
          <p>
            <span className="font-semibold">E-mail :</span> {seller.email}
          </p>
          {seller.phone && (
            <p>
              <span className="font-semibold">Téléphone :</span> {seller.phone}
            </p>
          )}
        </div>
        <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4 text-xs shadow-sm">
          <p className="font-semibold">Facturé à</p>
          <Separator />
          <p>
            <span className="font-semibold">Nom :</span> {buyer.name}
          </p>
          <p>
            <span className="font-semibold">Adresse :</span> {buyer.address}
          </p>
          <p>
            <span className="font-semibold">E-mail :</span> {buyer.email}
          </p>
          {buyer.phone && (
            <p>
              <span className="font-semibold">Téléphone :</span> {buyer.phone}
            </p>
          )}
        </div>
      </div>

      {/* Motif */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">
          Motif de l'avoir <span className="text-red-500">*</span>
        </Label>
        {readonly ? (
          <p className="text-xs text-muted-foreground">{motif}</p>
        ) : (
          <Textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Ex: Annulation partielle suite à désistement de stagiaires…"
            rows={3}
            className="text-xs"
          />
        )}
      </div>

      {/* Courses count + Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            Nombre de cours <span className="text-red-500">*</span>
          </Label>
          {readonly ? (
            <p className="text-xs text-muted-foreground">{coursesCount}</p>
          ) : (
            <Input
              type="number"
              min={1}
              value={coursesCount}
              onChange={(e) => setCoursesCount(Math.max(1, Number(e.target.value)))}
              className="h-8 text-xs"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            Montant (€) <span className="text-red-500">*</span>
          </Label>
          {readonly ? (
            <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
              {formatEur(Number(amountEur))}
            </p>
          ) : (
            <Input
              type="number"
              min={0}
              step={0.01}
              value={amountEur}
              onChange={(e) => setAmountEur(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0.00"
              className="h-8 text-xs"
            />
          )}
        </div>
      </div>

      {/* Summary */}
      {Number(amountEur) > 0 && (
        <div className="flex justify-end">
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-right text-xs shadow-sm sm:min-w-52">
            <p className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Montant total de l'avoir :</span>
              <span className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>
                {formatEur(Number(amountEur))}
              </span>
            </p>
          </div>
        </div>
      )}

      {!readonly && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/90"
            disabled={!canValidate}
            onClick={handleValidate}
          >
            Valider l'avoir
          </Button>
        </div>
      )}
    </div>
  );
}
