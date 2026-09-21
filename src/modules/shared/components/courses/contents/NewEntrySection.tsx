'use client';

import { useRef, useState } from 'react';
import { useAddEntry, useUpdateEntry } from '../hooks/useCourseContentApi';
import type { ApiContentEntry } from '../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import { DynamicContentForm } from './forms/DynamicContentForm';
import type { ScormPackageFieldState } from './forms/fields/ScormPackageField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CatalogLockAlert } from '@/shared/components/CatalogLockAlert';
import { toast } from 'sonner';
import { apiMessage } from '@/shared/utils/api-error';

/**
 * Right-panel component shown when the user has picked a ContentType but
 * hasn't saved the entry yet (local / pending state).
 *
 * No API call is made until the user clicks "Enregistrer".
 * On submit  → create, then publish only if the publication switch is checked.
 * The create endpoint does not accept is_published, so publication uses a PUT.
 * On cancel  → the pending entry is discarded (parent removes it from local state)
 */
export function NewEntrySection({
  sectionId,
  contentType,
  onCreated,
  onCancel,
  locked = false,
  lockReason = '',
}: {
  sectionId: string;
  contentType: ContentTypeResource;
  onCreated: (entry: ApiContentEntry) => void;
  onCancel: () => void;
  /**
   * Course frozen by a sale. Adding an entry is refused outright — unlike editing an
   * existing one, where only publishing is blocked.
   *
   * The prop matters even though the section list already hides the "add" affordance
   * when locked: the sections and the lock are fetched in parallel, so a user can
   * reach this pending state before the lock resolves. The flag flipping to true here
   * is what closes that window.
   */
  locked?: boolean;
  lockReason?: string;
}) {
  const addEntry = useAddEntry(sectionId);
  const updateEntry = useUpdateEntry();
  const savingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [scormState, setScormState] = useState<ScormPackageFieldState>({
    packageId: null,
    status: null,
  });

  const handleSave = async (data: Record<string, unknown>) => {
    if (savingRef.current) return;
    // Defence in depth: the form below is replaced by a notice when `locked`, but the
    // flag can flip between a render and this submit.
    if (locked) {
      toast.error(
        lockReason || 'Ce cours est lié à une formation vendue : la structure est figée.',
      );
      return;
    }

    if (
      isPublished &&
      contentType.module_type === 'scorm' &&
      (!scormState.packageId || scormState.status !== 'ready')
    ) {
      toast.error('Le package SCORM doit être prêt avant de pouvoir enregistrer et publier.');
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    let createdEntry: ApiContentEntry | undefined;
    try {
      const { data: entry } = await addEntry.mutateAsync({
        contentTypeId: contentType.id,
        data,
        scormPackageId: scormState.packageId ?? undefined,
      });
      createdEntry = entry;
      if (isPublished) {
        const { data: publishedEntry } = await updateEntry.mutateAsync({
          entryId: entry.id,
          sectionId,
          isPublished: true,
        });
        toast.success('Contenu créé et publié');
        onCreated(publishedEntry);
      } else {
        toast.success('Contenu créé');
        onCreated(entry);
      }
    } catch (err) {
      if (createdEntry) {
        // Keep the successfully created entry selected: retrying must update it,
        // not create a duplicate after a failed publication request.
        toast.error(
          `Contenu créé, mais non publié. ${apiMessage(err, 'Réessayez avec le bouton de publication.')}`,
        );
        onCreated(createdEntry);
      } else {
        toast.error(apiMessage(err, 'Erreur lors de la création du contenu'));
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Nouveau contenu</p>
          <p className="text-xs text-muted-foreground">
            Renseignez les informations puis cliquez sur Enregistrer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground">
            Non enregistré
          </Badge>
          <Badge className="bg-blue-400">{contentType.title}</Badge>
          <div className="ml-2 flex items-center gap-1.5">
            <Switch
              id={`publish-new-${sectionId}`}
              checked={isPublished}
              onCheckedChange={setIsPublished}
              disabled={isSaving || locked}
              className="data-[state=checked]:bg-(--color-primary)"
            />
            <Label
              htmlFor={`publish-new-${sectionId}`}
              className="cursor-pointer text-xs text-muted-foreground"
            >
              {isPublished ? 'Publié' : 'Brouillon'}
            </Label>
          </div>
        </div>
      </div>
      <Separator />
      <main className="mt-5 space-y-4">
        {locked ? (
          // The form is replaced rather than disabled: nothing typed into it could be
          // saved, so leaving it up would only invite the user to fill it in first and
          // be refused afterwards.
          <div className="space-y-4">
            <CatalogLockAlert title="Impossible d'ajouter un contenu">
              {lockReason ||
                'Ce cours appartient à un module lié à une formation vendue : sa structure est figée.'}
            </CatalogLockAlert>
            <Button variant="outline" onClick={onCancel}>
              Fermer
            </Button>
          </div>
        ) : (
          <DynamicContentForm
            contentType={contentType}
            onCancel={onCancel}
            onSubmit={handleSave}
            isSubmitting={isSaving}
            requireReadyScorm={isPublished}
            onScormStateChange={setScormState}
          />
        )}
      </main>
    </div>
  );
}
