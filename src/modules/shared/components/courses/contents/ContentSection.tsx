import { useCourseStore } from '../hooks/useCouseContentStore';
import { CONTENT_TYPE_META, ContentType, CourseContent } from '../types';
import { DynamicContentForm } from './forms/DynamicContentForm';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function SectionContent({
  sectionId,
  content,
  onDeselect,
}: {
  sectionId: string;
  content: CourseContent;
  onDeselect: () => void;
}) {
  const update = useCourseStore((s) => s.updateContent);
  const { type, id: contentId, contentTypeResource } = content;

  const handleSave = (titleOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => {
    const title = typeof titleOrData === 'string' ? titleOrData : (titleOrData.title as string ?? '');
    const resolvedData = typeof titleOrData === 'string' ? (data ?? {}) : titleOrData;
    update(sectionId, contentId, {
      title,
      sectionId,
      type,
      id: contentId,
      data: resolvedData,
    });
  };

  const typeMeta = CONTENT_TYPE_META[type as ContentType];
  const badgeColor = typeMeta?.bgColor ?? 'bg-gray-400';
  const badgeLabel = contentTypeResource?.title ?? typeMeta?.label ?? type;

  return (
    <div className="flex flex-col space">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Configuration du contenu</p>
          <p className="text-xs text-muted-foreground">Renseignez les informations du contenu.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={badgeColor}>{badgeLabel}</Badge>
        </div>
      </div>
      <Separator />
      <main className="mt-5">
        {/* Dynamic form from DB schema takes priority */}
        {contentTypeResource ? (
          <DynamicContentForm
            contentType={contentTypeResource}
            onCancel={onDeselect}
            onSubmit={handleSave}
          />
        ) : null }
      </main>
    </div>
  );
}
