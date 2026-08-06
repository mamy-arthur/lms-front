'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, Search } from 'lucide-react';
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
import { useMailTemplatesQuery } from '@/modules/admin/resources/mail-templates/hooks/useMailTemplatesQuery';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplateId?: string;
  onSelect: (template: EmailTemplate) => Promise<void>;
};

export function SelectEmailTemplateDialog({
  open,
  onOpenChange,
  initialTemplateId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: queryData, isLoading } = useMailTemplatesQuery();
  const data = queryData?.data;

  // Restore initial selection when data loads
  useEffect(() => {
    if (!initialTemplateId || !data) return;
    const found = data.find((t) => t.id === initialTemplateId);
    if (found) setSelected({ id: found.id, name: found.name, subject: found.subject });
  }, [initialTemplateId, data]);

  const filtered = useMemo(
    () => (data ?? []).filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
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
            {isLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading &&
              filtered.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() =>
                    setSelected({ id: template.id, name: template.name, subject: template.subject })
                  }
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
                  </div>
                </button>
              ))}
            {!isLoading && filtered.length === 0 && (
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
            disabled={!selected || isSaving}
            onClick={async () => {
              if (!selected) return;
              setIsSaving(true);
              try {
                await onSelect(selected);
                setSelected(null);
                onOpenChange(false);
              } catch {
                // error already toasted by onSelect
              } finally {
                setIsSaving(false);
              }
            }}
            className="bg-(--color-primary) hover:bg-primary/80"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Mail className="size-3.5" />
            )}
            Choisir ce modèle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
