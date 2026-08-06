'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/lib/cn';
import { useCertificatesQuery } from '@/modules/admin/resources/certificates/hooks/useCertificatesQuery';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttestationItem = {
  id: string;
  name: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAttestationId?: string;
  onSelect: (attestation: AttestationItem) => Promise<void>;
};

export function SelectAttestationDialog({
  open,
  onOpenChange,
  initialAttestationId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AttestationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useCertificatesQuery({ status: 'active' });
  const attestations = data?.data ?? [];

  const filtered = useMemo(
    () => attestations.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [attestations, search],
  );

  // Pre-select the current attestation when the list loads
  const displaySelected =
    selected ??
    (initialAttestationId
      ? (attestations.find((a) => a.id === initialAttestationId) ?? null)
      : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sélectionner une attestation</DialogTitle>
          <DialogDescription>
            Choisissez une attestation dans la liste ci-dessous.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une attestation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pr-1">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading &&
              filtered.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => setSelected(att)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors',
                    displaySelected?.id === att.id
                      ? 'border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-300'
                      : 'border-border hover:border-emerald-400/60 hover:bg-emerald-50/50',
                  )}
                >
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold">{att.name}</p>
                  </div>
                </button>
              ))}
            {!isLoading && filtered.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Aucune attestation ne correspond à votre recherche.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setSelected(null);
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button
            disabled={!displaySelected || isSaving}
            onClick={async () => {
              if (!displaySelected) return;
              setIsSaving(true);
              try {
                await onSelect(displaySelected);
                setSelected(null);
                onOpenChange(false);
              } catch {
                // L'erreur est déjà gérée (toast) dans l'appelant — on garde la modale ouverte
              } finally {
                setIsSaving(false);
              }
            }}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            {isSaving ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Plus />}
            {initialAttestationId ? "Modifier l'attestation" : "Ajouter l'attestation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
