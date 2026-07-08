'use client';

import { useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
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

export interface TransactionFilters {
  search: string;
  category: string;
  type: string;
  refundable: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const defaultFilters: TransactionFilters = {
  search: '',
  category: 'all',
  type: 'all',
  refundable: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

interface TransactionHistoryFilterProps {
  onApplyFilters?: (filters: TransactionFilters) => void;
}

export function TransactionHistoryFilter({ onApplyFilters }: TransactionHistoryFilterProps) {
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [draft, setDraft] = useState<TransactionFilters>(defaultFilters);
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
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs  text-(--color-primary) hover:text-(--color-primary)"
        >
          <Filter className="size-3.5 " />
          Rechercher / filtrer
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
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur, une description..."
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              className="pl-8 text-xs"
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] py-2 font-medium uppercase tracking-wide text-muted-foreground">
              Type de transaction
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Catégorie</Label>
                <Select
                  value={draft.category}
                  onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="achat">Achat de points</SelectItem>
                    <SelectItem value="remboursement">Remboursement</SelectItem>
                    <SelectItem value="frais">Frais interne</SelectItem>
                    <SelectItem value="transfert">Transfert</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Débit / Crédit</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="debit">Débit</SelectItem>
                    <SelectItem value="credit">Crédit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <p className="my-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Remboursabilité
            </p>
            <div className="flex gap-1.5">
              {(
                [
                  { value: 'all', label: 'Tous' },
                  { value: 'no', label: 'Non' },
                  { value: 'yes', label: 'Oui' },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, refundable: option.value }))}
                  className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                    draft.refundable === option.value
                      ? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
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
              Montant
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
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              setDraft(defaultFilters);
              setFilters(defaultFilters);
              onApplyFilters?.(defaultFilters);
            }}
          >
            Réinitialiser
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-(--color-primary) text-xs text-white hover:bg-(--color-primary)/90"
            onClick={() => {
              setFilters(draft);
              onApplyFilters?.(draft);
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
