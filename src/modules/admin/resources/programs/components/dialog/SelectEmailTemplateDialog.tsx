'use client';

import { useMemo, useState } from 'react';
import { Mail, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  category: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'et1',
    name: 'Bienvenue dans le parcours',
    subject: 'Bienvenue ! Votre formation commence maintenant',
    category: 'Démarrage',
  },
  {
    id: 'et2',
    name: 'Rappel de connexion',
    subject: 'Votre formation vous attend — connectez-vous',
    category: 'Relance',
  },
  {
    id: 'et3',
    name: 'Module complété',
    subject: 'Bravo ! Vous avez terminé ce module avec succès',
    category: 'Progression',
  },
  {
    id: 'et4',
    name: "Invitation à l'évaluation",
    subject: 'Vous pouvez maintenant passer votre évaluation',
    category: 'Évaluation',
  },
  {
    id: 'et5',
    name: "Résultats d'évaluation",
    subject: "Vos résultats d'évaluation sont disponibles",
    category: 'Évaluation',
  },
  {
    id: 'et6',
    name: 'Attestation disponible',
    subject: 'Votre attestation est prête à télécharger',
    category: 'Certification',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplateId?: string;
  onSelect: (template: EmailTemplate) => void;
};

export function SelectEmailTemplateDialog({
  open,
  onOpenChange,
  initialTemplateId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EmailTemplate | null>(
    initialTemplateId
      ? (MOCK_EMAIL_TEMPLATES.find((t) => t.id === initialTemplateId) ?? null)
      : null,
  );

  const filtered = useMemo(
    () => MOCK_EMAIL_TEMPLATES.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Modèle d'email de démarrage</DialogTitle>
          <DialogDescription>
            Choisissez le modèle d'email à envoyer au début du parcours.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un modèle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pr-1">
            {filtered.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelected(template)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors',
                  selected?.id === template.id
                    ? 'border-violet-400 bg-violet-50/60 ring-1 ring-violet-300'
                    : 'border-border hover:border-violet-400/60 hover:bg-violet-50/50',
                )}
              >
                <Mail className="mt-0.5 size-4 shrink-0 text-violet-500" />
                <div>
                  <p className="text-xs font-semibold">{template.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{template.subject}</p>
                  <Badge
                    variant="outline"
                    className="mt-1 border-violet-200 text-[10px] text-violet-700"
                  >
                    {template.category}
                  </Badge>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                Aucun modèle ne correspond à votre recherche.
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
            className="bg-(--color-primary) hover:bg-primary/80"
          >
            <Mail className="size-3.5" />
            Choisir ce modèle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
