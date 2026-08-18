import { useState } from 'react';
import { useUpdateEntry } from '../hooks/useCourseContentApi';
import type { ApiContentEntry } from '../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import { DynamicContentForm } from './forms/DynamicContentForm';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SectionContent({
  sectionId,
  entry,
  contentType,
  onDeselect,
}: {
  sectionId: string;
  entry: ApiContentEntry;
  contentType: ContentTypeResource;
  onDeselect: () => void;
}) {
  const updateEntry = useUpdateEntry();
  const [isPublished, setIsPublished] = useState(entry.is_published);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      await updateEntry.mutateAsync({ entryId: entry.id, sectionId, data });
      toast.success('Contenu enregistré');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleTogglePublish = async (published: boolean) => {
    setIsPublished(published);
    try {
      await updateEntry.mutateAsync({ entryId: entry.id, sectionId, isPublished: published });
      toast.success(published ? 'Contenu publié' : 'Contenu dépublié');
    } catch {
      setIsPublished(!published);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="flex flex-col space">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Configuration du contenu</p>
          <p className="text-xs text-muted-foreground">Renseignez les informations du contenu.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-400">{contentType.title}</Badge>
          <div className="flex items-center gap-1.5 ml-2">
            <Switch
              id={`publish-${entry.id}`}
              checked={isPublished}
              onCheckedChange={handleTogglePublish}
              disabled={updateEntry.isPending}
              className="data-[state=checked]:bg-(--color-primary)"
            />
            <Label
              htmlFor={`publish-${entry.id}`}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {isPublished ? 'Publié' : 'Brouillon'}
            </Label>
          </div>
        </div>
      </div>
      <Separator />
      <main className="mt-5">
        <DynamicContentForm
          contentType={contentType}
          initialData={entry.data}
          onCancel={onDeselect}
          onSubmit={handleSave}
        />
      </main>
    </div>
  );
}
