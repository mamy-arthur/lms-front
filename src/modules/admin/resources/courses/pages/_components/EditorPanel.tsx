import { Loader2 } from 'lucide-react';

import type { ApiContentEntry } from '../../../../../shared/components/courses/hooks/useCourseContentApi';
import { SectionContent } from '@/modules/shared/components/courses/contents/ContentSection';
import { NewEntrySection } from '@/modules/shared/components/courses/contents/NewEntrySection';
import { useContentTypeQuery } from '@/modules/shared/components/courses/hooks/useContentTypesQuery';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

export type Selection =
  | { kind: 'existing'; entry: ApiContentEntry }
  | { kind: 'pending'; contentType: ContentTypeResource; sectionId: string }
  | null;

interface Props {
  selection: Selection;
  onDeselect: () => void;
  onCreated: (entry: ApiContentEntry) => void;
  /**
   * Course frozen by a sale. What it blocks depends on the branch below: creating an
   * entry is refused outright, while an existing one stays editable and only loses
   * the publish toggle.
   */
  locked?: boolean;
  lockReason?: string;
}

export function EditorPanel({
  selection,
  onDeselect,
  onCreated,
  locked = false,
  lockReason = '',
}: Props) {
  const existingContentTypeId =
    selection?.kind === 'existing' ? selection.entry.content_type_id : undefined;
  const { data: contentType, isLoading } = useContentTypeQuery(existingContentTypeId);

  if (selection === null) {
    return (
      <div className="flex h-125 items-center justify-center text-center">
        <div>
          <h3 className="font-medium text-sm">Aucun contenu sélectionné</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Sélectionnez un contenu dans la liste pour commencer l'édition.
          </p>
        </div>
      </div>
    );
  }

  if (selection.kind === 'pending') {
    return (
      <NewEntrySection
        key={`${selection.sectionId}-${selection.contentType.id}`}
        sectionId={selection.sectionId}
        contentType={selection.contentType}
        onCreated={onCreated}
        onCancel={onDeselect}
        locked={locked}
        lockReason={lockReason}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contentType) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <h3 className="font-medium text-sm">Type de contenu introuvable</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Impossible de charger la définition du type de contenu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SectionContent
      key={selection.entry.id}
      sectionId={selection.entry.course_section_id}
      entry={selection.entry}
      contentType={contentType}
      onDeselect={onDeselect}
      locked={locked}
      lockReason={lockReason}
    />
  );
}
