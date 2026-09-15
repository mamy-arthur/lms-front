import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUpdateEntry, useAttachScormPackage } from '../hooks/useCourseContentApi';
import type { ApiContentEntry } from '../hooks/useCourseContentApi';
import type { ContentTypeResource } from '@/shared/types/content-type.types';
import type { ScormPackageStatus } from '@/shared/api/scorm.api';
import { DynamicContentForm } from './forms/DynamicContentForm';
import type { ScormPackageFieldState } from './forms/fields/ScormPackageField';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { apiMessage } from '@/shared/utils/api-error';

export function SectionContent({
  sectionId,
  entry,
  contentType,
  onDeselect,
  locked = false,
  lockReason = '',
}: {
  sectionId: string;
  entry: ApiContentEntry;
  contentType: ContentTypeResource;
  onDeselect: () => void;
  /**
   * Course frozen by a sale. Editing the payload stays open; publishing does not —
   * the learner's tree only counts published entries, so the toggle moves their
   * progress denominator exactly like an add or a delete would.
   */
  locked?: boolean;
  lockReason?: string;
}) {
  const updateEntry = useUpdateEntry();
  const attachScormPackage = useAttachScormPackage(sectionId);
  const [isPublished, setIsPublished] = useState(entry.is_published);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  const isScorm = contentType.module_type === 'scorm';
  const attachedScormPackageId = (entry.data.scorm_package_id as string | undefined) ?? null;
  const [scormState, setScormState] = useState<ScormPackageFieldState>({
    packageId: attachedScormPackageId,
    status: null,
  });
  // While unresolved (null), a scorm entry cannot be published yet.
  const canPublishScorm = !isScorm || scormState.status === ('ready' as ScormPackageStatus);
  const scormBlockReason = !scormState.packageId
    ? 'Le package SCORM doit exister avant de pouvoir publier ce contenu.'
    : "Le package SCORM est encore en cours de traitement. Attendez qu'il soit prêt pour publier ce contenu.";

  // The sale lock wins over the SCORM one: it blocks BOTH directions (a locked
  // content can neither be published nor unpublished), while the SCORM rule only
  // ever stands in the way of publishing.
  //
  // The boolean is kept separate from the message on purpose: deriving "is it
  // blocked" from a truthy string would silently re-enable the switch if a caller
  // passed `locked` without a reason.
  const isPublishBlocked = locked || (!isPublished && !canPublishScorm);
  const publishBlockReason = locked
    ? lockReason || 'Ce cours est lié à une formation vendue : la publication est figée.'
    : scormBlockReason;

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (isScorm && scormState.packageId && scormState.packageId !== attachedScormPackageId) {
        await attachScormPackage.mutateAsync({
          entryId: entry.id,
          scormPackageId: scormState.packageId,
        });
      }
      await updateEntry.mutateAsync({ entryId: entry.id, sectionId, data });
      toast.success('Contenu enregistré');
    } catch (err) {
      toast.error(apiMessage(err, 'Erreur lors de la sauvegarde'));
    }
  };

  const handleTogglePublish = async (published: boolean) => {
    if (published && !canPublishScorm) {
      toast.error(scormBlockReason);
      return;
    }
    setIsPublished(published);
    setIsTogglingPublish(true);
    try {
      await updateEntry.mutateAsync({ entryId: entry.id, sectionId, isPublished: published });
      toast.success(published ? 'Contenu publié' : 'Contenu dépublié');
    } catch (err) {
      setIsPublished(!published);
      toast.error(apiMessage(err, 'Erreur lors de la mise à jour'));
    } finally {
      setIsTogglingPublish(false);
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
            {isTogglingPublish ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : isPublishBlocked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Switch
                      id={`publish-${entry.id}`}
                      checked={isPublished}
                      disabled
                      className="data-[state=checked]:bg-(--color-primary)"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{publishBlockReason}</TooltipContent>
              </Tooltip>
            ) : (
              <Switch
                id={`publish-${entry.id}`}
                checked={isPublished}
                onCheckedChange={handleTogglePublish}
                disabled={isTogglingPublish}
                className="data-[state=checked]:bg-(--color-primary)"
              />
            )}
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
      <main className="mt-5 space-y-5">
        <DynamicContentForm
          contentType={contentType}
          initialData={entry.data}
          onCancel={onDeselect}
          onSubmit={handleSave}
          isSubmitting={updateEntry.isPending}
          attachedScormPackageId={attachedScormPackageId}
          onScormStateChange={setScormState}
        />
      </main>
    </div>
  );
}
