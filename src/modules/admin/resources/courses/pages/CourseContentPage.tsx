'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import type { ApiContentEntry } from '../../../../shared/components/courses/hooks/useCourseContentApi';
import {
  useSections,
  useAddSection,
} from '../../../../shared/components/courses/hooks/useCourseContentApi';
import { SectionCard } from '@/modules/shared/components/courses/contents/SectionCard';
import { SectionContent } from '@/modules/shared/components/courses/contents/ContentSection';
import { NewEntrySection } from '@/modules/shared/components/courses/contents/NewEntrySection';
import { ContentPreviewDrawer } from '@/modules/shared/components/courses/contents/preview/components/ContentPreviewDrawer';
import { useContentTypeQuery } from '@/modules/shared/components/courses/hooks/useContentTypesQuery';
import type { ContentTypeResource } from '@/shared/types/content-type.types';

interface Props {
  courseId: string;
}

/**
 * Discriminated union for the right-panel selection:
 *
 *  - `existing` — user clicked a saved ContentEntry → edit mode (PUT)
 *  - `pending`  — user picked a ContentType but hasn't saved yet → create mode (POST on submit)
 *  - `null`     — nothing selected
 */
type Selection =
  | { kind: 'existing'; entry: ApiContentEntry }
  | { kind: 'pending'; contentType: ContentTypeResource; sectionId: string }
  | null;

export function CourseContentPage({ courseId }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);

  const { data: sections = [], isLoading } = useSections(courseId);
  const addSection = useAddSection(courseId);

  // For EXISTING entries, fetch the up-to-date ContentType schema via GET /platform/content-types/{id}.
  // For PENDING entries, the schema is already available from the ContentTypePicker — no extra call.
  const existingContentTypeId =
    selection?.kind === 'existing' ? selection.entry.content_type_id : undefined;
  const { data: existingContentType, isLoading: ctLoading } =
    useContentTypeQuery(existingContentTypeId);

  const handleAddSection = async () => {
    try {
      await addSection.mutateAsync(`Section ${sections.length + 1}`);
    } catch {
      toast.error('Erreur lors de la création de la section');
    }
  };

  return (
    <div className="bg-background">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contenu du cours</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Organisez votre cours en sections et ressources.
          </p>
        </div>
        <div>
          {/* <Button
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
            onClick={() => setPreviewOpen(true)}
          >
            <BookOpen className="size-4" />
            Prévisualisation
          </Button> */}
        </div>
      </header>

      <main className="mx-auto py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            {/* Navigation */}
            <aside className="space-y-3">
              {sections
                .slice()
                .sort((a, b) => a.rank - b.rank)
                .map((section) => {
                  const isPendingHere =
                    selection?.kind === 'pending' && selection.sectionId === section.id;

                  return (
                    <SectionCard
                      key={section.id}
                      courseId={courseId}
                      section={section}
                      selectedEntryId={
                        selection?.kind === 'existing' ? selection.entry.id : undefined
                      }
                      onSelectEntry={(entry) => setSelection({ kind: 'existing', entry })}
                      onEntryDeleted={(id) => {
                        if (selection?.kind === 'existing' && selection.entry.id === id) {
                          setSelection(null);
                        }
                      }}
                      // Pending entry props — only set for the section that owns the draft
                      pendingEntry={
                        isPendingHere
                          ? {
                              moduleType: selection.contentType.module_type,
                              title: selection.contentType.title,
                            }
                          : undefined
                      }
                      pendingEntrySelected={isPendingHere}
                      onPendingEntrySelect={() => {
                        // Re-select the pending entry if the user clicked away
                        if (selection?.kind === 'pending') {
                          setSelection({ ...selection });
                        }
                      }}
                      onPendingEntryCancel={() => setSelection(null)}
                      onContentTypeSelected={(ct) =>
                        setSelection({ kind: 'pending', contentType: ct, sectionId: section.id })
                      }
                    />
                  );
                })}
              <Button
                variant="outline"
                onClick={handleAddSection}
                disabled={addSection.isPending}
                className="w-full border-dashed py-6 text-muted-foreground hover:text-foreground"
              >
                {addSection.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Ajouter une section
              </Button>
              {sections.length === 0 && !isLoading && (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Aucune section pour le moment.
                </p>
              )}
            </aside>

            {/* Edition */}
            <main className="min-h-125 rounded-xl border bg-card p-4">
              {selection === null && (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <h3 className="font-medium text-sm">Aucun contenu sélectionné</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sélectionnez un contenu dans la liste pour commencer l'édition.
                    </p>
                  </div>
                </div>
              )}

              {selection?.kind === 'pending' && (
                <NewEntrySection
                  key={`${selection.sectionId}-${selection.contentType.id}`}
                  sectionId={selection.sectionId}
                  contentType={selection.contentType}
                  onCreated={(entry) => setSelection({ kind: 'existing', entry })}
                  onCancel={() => setSelection(null)}
                />
              )}

              {selection?.kind === 'existing' &&
                (ctLoading ? (
                  <div className="flex h-full items-center justify-center py-16">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : existingContentType ? (
                  <SectionContent
                    key={selection.entry.id}
                    sectionId={selection.entry.course_section_id}
                    entry={selection.entry}
                    contentType={existingContentType}
                    onDeselect={() => setSelection(null)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <h3 className="font-medium text-sm">Type de contenu introuvable</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Impossible de charger la définition du type de contenu.
                      </p>
                    </div>
                  </div>
                ))}
            </main>
          </div>
        )}
      </main>
      <ContentPreviewDrawer open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
