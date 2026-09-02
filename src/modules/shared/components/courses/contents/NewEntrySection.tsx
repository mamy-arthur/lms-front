'use client';

import { useAddEntry } from '../hooks/useCourseContentApi';
import type { ApiContentEntry } from '../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import { DynamicContentForm } from './forms/DynamicContentForm';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
}: {
  sectionId: string;
  contentType: ContentTypeResource;
  onCreated: (entry: ApiContentEntry) => void;
  onCancel: () => void;
}) {
  const addEntry = useAddEntry(sectionId);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      const { data: entry } = await addEntry.mutateAsync({ contentTypeId: contentType.id, data });
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
        {contentType.module_type === 'scorm' && (
          <p className="rounded-sm border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            Enregistrez d'abord ce contenu pour pouvoir y attacher un package SCORM (.zip).
          </p>
        )}
        <DynamicContentForm
          contentType={contentType}
          onCancel={onCancel}
          onSubmit={handleSave}
          isSubmitting={addEntry.isPending}
        />
      </main>
    </div>
  );
}
