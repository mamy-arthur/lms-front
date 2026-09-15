'use client';

import { useState } from 'react';
import { useAddEntry } from '../hooks/useCourseContentApi';
import type { ApiContentEntry } from '../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import { DynamicContentForm } from './forms/DynamicContentForm';
import type { ScormPackageFieldState } from './forms/fields/ScormPackageField';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CatalogLockAlert } from '@/shared/components/CatalogLockAlert';
import { toast } from 'sonner';

/**
 * Right-panel component shown when the user has picked a ContentType but
 * hasn't saved the entry yet (local / pending state).
 *
 * No API call is made until the user clicks "Enregistrer".
 * On submit  → POST /platform/course-sections/{sectionId}/entries
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
  const [scormState, setScormState] = useState<ScormPackageFieldState>({
    packageId: null,
    status: null,
  });

  const handleSave = async (data: Record<string, unknown>) => {
    // Defence in depth: the form below is replaced by a notice when `locked`, but the
    // flag can flip between a render and this submit.
    if (locked) {
      toast.error(
        lockReason || 'Ce cours est lié à une formation vendue : la structure est figée.',
      );
      return;
    }

    try {
      // The SCORM package may still be `pending`/processing — attaching it right
      // away (instead of waiting) is explicitly supported by the create endpoint.
      const { data: entry } = await addEntry.mutateAsync({
        contentTypeId: contentType.id,
        data,
        scormPackageId: scormState.packageId ?? undefined,
      });
      toast.success('Contenu créé');
      onCreated(entry);
    } catch {
      toast.error('Erreur lors de la création du contenu');
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
            Brouillon
          </Badge>
          <Badge className="bg-blue-400">{contentType.title}</Badge>
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
            isSubmitting={addEntry.isPending}
            onScormStateChange={setScormState}
          />
        )}
      </main>
    </div>
  );
}
