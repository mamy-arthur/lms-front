'use client';

import { useState } from 'react';
import { Settings2, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface InvoiceFiltersValue {
  search: string;
  type: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const defaultInvoiceFilters: InvoiceFiltersValue = {
  search: '',
  type: 'all',
  paymentMethod: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

interface InvoiceFiltersProps {
  onApplyFilters: (filters: InvoiceFiltersValue) => void;
}

export function InvoiceFilters({ onApplyFilters }: InvoiceFiltersProps) {
  const [filters, setFilters] = useState<InvoiceFiltersValue>(defaultInvoiceFilters);
  const [draft, setDraft] = useState<InvoiceFiltersValue>(defaultInvoiceFilters);
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(filters);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-1.5 text-xs">
          <Settings2 />
          Filtre
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 overflow-hidden rounded-2xl p-0">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" />
            <span className="text-sm font-medium">Filtres avancés</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 pb-4">
          <div>
            <p className="mb-2 text-[11px] py-2 font-medium uppercase tracking-wide text-muted-foreground">
              Type de facture
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Facture">Facture</SelectItem>
                    <SelectItem value="Avoir">Avoir</SelectItem>
                    <SelectItem value="Proforma">Proforma</SelectItem>
                    <SelectItem value="Note de crédit">Note de crédit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Paiement</Label>
                <Select
                  value={draft.paymentMethod}
                  onValueChange={(v) => setDraft((d) => ({ ...d, paymentMethod: v }))}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="Stripe">Stripe</SelectItem>
                    <SelectItem value="Virement Bancaire">Virement Bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <p className="my-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Période
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Du</Label>
                <Input
                  type="date"
                  value={draft.dateFrom}
                  onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Au</Label>
                <Input
                  type="date"
                  value={draft.dateTo}
                  onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="my-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Montant TTC
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={draft.amountMin}
                onChange={(e) => setDraft((d) => ({ ...d, amountMin: e.target.value }))}
                className="text-xs"
              />
              <Input
                type="number"
                placeholder="Max"
                value={draft.amountMax}
                onChange={(e) => setDraft((d) => ({ ...d, amountMax: e.target.value }))}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t bg-muted/40 px-5 py-3">
          <Button
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => {
              setDraft(defaultInvoiceFilters);
              setFilters(defaultInvoiceFilters);
              onApplyFilters(defaultInvoiceFilters);
            }}
          >
            Réinitialiser
          </Button>
          <Button
            className="flex-1 bg-(--color-primary) text-xs text-white hover:bg-(--color-primary)/90"
            onClick={() => {
              setFilters(draft);
              onApplyFilters(draft);
              setOpen(false);
            }}
          >
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
