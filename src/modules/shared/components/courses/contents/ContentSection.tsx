import { useCourseStore } from '../hooks/useCouseContentStore';
import { CONTENT_TYPE_META, ContentType, CourseContent } from '../types';
import { PageForm } from './forms/PageForm';
import { FileForm } from './forms/FileForm';
import { FolderForm } from './forms/FolderForm';
import { ScormForm } from './forms/ScormForm';
import { UrlForm } from './forms/UrlForm';
import { TextMediaForm } from './forms/TextMediaForm';
import { SurveyForm } from './forms/SurveyForm';
import { DynamicContentForm } from './forms/DynamicContentForm';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function SectionContent({
  sectionId,
  content,
}: {
  sectionId: string;
  content: CourseContent;
}) {
  const update = useCourseStore((s) => s.updateContent);
  const remove = useCourseStore((s) => s.removeContent);
  const { type, id: contentId, contentTypeResource } = content;

  const goBack = () => {
    remove(sectionId, contentId);
  };

  const handleSave = (title: string, data: Record<string, unknown>) => {
    update(sectionId, contentId, {
      title,
      sectionId,
      type,
      id: contentId,
      data,
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
        <Badge className={badgeColor}>{badgeLabel}</Badge>
      </div>

      <Separator />
      <main className="mt-5">
        {/* Dynamic form from DB schema takes priority */}
        {contentTypeResource ? (
          <DynamicContentForm
            contentType={contentTypeResource}
            onCancel={goBack}
            onSubmit={handleSave}
          />
        ) : (
          <>
            {type === 'page' && (
              <PageForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
            )}
            {type === 'file' && (
              <FileForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
            )}
            {type === 'folder' && (
              <FolderForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
            )}
            {type === 'scorm' && (
              <ScormForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
            )}
            {type === 'url' && (
              <UrlForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
            )}
            {type === 'text-media' && (
              <TextMediaForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
            )}
            {type === 'survey' && (
              <SurveyForm onCancel={goBack} onSubmit={(v) => handleSave(v.title, v)} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
