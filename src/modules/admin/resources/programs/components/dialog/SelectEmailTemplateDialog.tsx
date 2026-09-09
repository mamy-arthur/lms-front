'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mail, Plus, Search } from 'lucide-react';
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
import type { MutationLike } from '@/shared/types/mutation';
import {
  useCreateMailTemplate,
  useMailTemplatesQuery,
  useUpdateMailTemplate,
  useUploadMailTemplateMedia,
} from '@/modules/admin/resources/mail-templates';
import { MailTemplateFormDrawer } from '@modules/shared/components/mail-templates/MailTemplateFormDrawer';
import {
  normalizeMailTemplate,
  type CreateMailTemplatePayload,
} from '@modules/shared/components/mail-templates/types';

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
  const [createOpen, setCreateOpen] = useState(false);

  const { data: queryData, isLoading } = useMailTemplatesQuery();
  const data = queryData?.data;

  const createMutation = useCreateMailTemplate();
  const updateMutation = useUpdateMailTemplate();
  const uploadMedia = useUploadMailTemplateMedia();

  // Confirme un modèle (bouton "Choisir ce modèle" ou création directe) et referme la modale.
  const confirmSelection = async (template: EmailTemplate) => {
    setIsSaving(true);
    try {
      await onSelect(template);
      setSelected(null);
      onOpenChange(false);
    } catch {
      // error already toasted by onSelect
    } finally {
      setIsSaving(false);
    }
  };

  // Intercepte la réponse de création du drawer partagé : le nouveau modèle est
  // utilisé directement (il sera de toute façon le modèle actif par défaut).
  const createMutationWithSelection: MutationLike = {
    ...createMutation,
    mutate: (variables: CreateMailTemplatePayload, options?: { onSuccess?: () => void }) =>
      createMutation.mutate(variables, {
        onSuccess: (response) => {
          const raw = (response as { data: Record<string, unknown> }).data;
          const created = normalizeMailTemplate(raw);
          options?.onSuccess?.();
          void confirmSelection({ id: created.id, name: created.name, subject: created.subject });
        },
      }),
  };

  // Suivi de restauration : voir l'effet ci-dessous.
  const hasRestoredSelectionRef = useRef(false);

  // Repart d'un état propre à chaque (ré)ouverture de la modale
  useEffect(() => {
    if (!open) return;
    setSearch('');
    setCreateOpen(false);
    createMutation.reset();
    hasRestoredSelectionRef.current = false;
  }, [open, createMutation.reset]);

  // Ne restaure `initialTemplateId` qu'une fois par ouverture : sans ce garde-fou,
  // un changement de `data` après coup (ex. invalidation suite à une création) écraserait
  // une sélection déjà faite par l'utilisateur (choix manuel ou modèle nouvellement créé).
  useEffect(() => {
    if (!open || hasRestoredSelectionRef.current || !data) return;
    hasRestoredSelectionRef.current = true;
    const found = initialTemplateId ? data.find((t) => t.id === initialTemplateId) : undefined;
    if (found) setSelected({ id: found.id, name: found.name, subject: found.subject });
  }, [open, initialTemplateId, data]);

  const filtered = useMemo(
    () => (data ?? []).filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  return (
    <>
      {/* Masquée tant que le drawer de création est ouvert : le nouveau modèle sera utilisé directement */}
      <Dialog open={open && !createOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modèle d'email de démarrage</DialogTitle>
            <DialogDescription>
              Choisissez le modèle d'email à envoyer au début du parcours.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un modèle…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Nouveau
              </Button>
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
                      setSelected({
                        id: template.id,
                        name: template.name,
                        subject: template.subject,
                      })
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
              onClick={() => selected && void confirmSelection(selected)}
              className="bg-(--color-primary) hover:bg-primary/80"
            >
              Choisir ce modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MailTemplateFormDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setCreateOpen(false)}
        createMutation={createMutationWithSelection}
        updateMutation={updateMutation}
        uploadMedia={uploadMedia}
        variablesApiPath="platform/template-variables"
      />
    </>
  );
}
