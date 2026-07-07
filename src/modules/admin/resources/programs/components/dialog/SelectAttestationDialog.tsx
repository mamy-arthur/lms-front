'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Plus, Search } from 'lucide-react';
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttestationItem = {
  id: string;
  name: string;
  description?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ATTESTATIONS: AttestationItem[] = [
  {
    id: 'at1',
    name: 'Développeur Web Full-Stack',
    description: 'Compétences en développement front-end et back-end',
  },
  {
    id: 'at2',
    name: 'Ingénieur DevOps',
    description: 'Maîtrise des pratiques DevOps, CI/CD et conteneurisation',
  },
  {
    id: 'at3',
    name: 'Chef de Projet Digital',
    description: "Gestion de projets numériques et animation d'équipes agiles",
  },
  {
    id: 'at4',
    name: 'Expert React',
    description: "Maîtrise avancée de l'écosystème React et Next.js",
  },
  {
    id: 'at5',
    name: 'Data Analyst',
    description: 'Analyse de données, visualisation et reporting',
  },
  {
    id: 'at6',
    name: 'Cybersécurité Web',
    description: 'Protection des applications web selon les standards OWASP',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAttestationId?: string;
  onSelect: (attestation: AttestationItem) => void;
};

export function SelectAttestationDialog({
  open,
  onOpenChange,
  initialAttestationId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AttestationItem | null>(
    initialAttestationId
      ? (MOCK_ATTESTATIONS.find((a) => a.id === initialAttestationId) ?? null)
      : null,
  );

  const filtered = useMemo(
    () => MOCK_ATTESTATIONS.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

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
            {filtered.map((att) => (
              <button
                key={att.id}
                type="button"
                onClick={() => setSelected(att)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors',
                  selected?.id === att.id
                    ? 'border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-300'
                    : 'border-border hover:border-emerald-400/60 hover:bg-emerald-50/50',
                )}
              >
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold">{att.name}</p>
                  {att.description && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{att.description}</p>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
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
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onSelect(selected);
              setSelected(null);
              onOpenChange(false);
            }}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            <Plus />
            {initialAttestationId ? "Modifier l'attestation" : "Ajouter l'attestation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
