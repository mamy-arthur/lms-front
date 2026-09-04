'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import {
  useSections,
  useAddSection,
  useReorderSections,
} from '../../../../shared/components/courses/hooks/useCourseContentApi';
import { SectionCard } from '@/modules/shared/components/courses/contents/SectionCard';
import { EditorPanel, type Selection } from './_components/EditorPanel';

interface Props {
  courseId: string;
}

export function CourseContentPage({ courseId }: Props) {
  const [selection, setSelection] = useState<Selection>(null);

  const { data: sections = [], isLoading } = useSections(courseId);
  const addSection = useAddSection(courseId);
  const reorderSections = useReorderSections(courseId);

  const sortedSections = sections.slice().sort((a, b) => a.rank - b.rank);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
    const newIndex = sortedSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedSections, oldIndex, newIndex).map((s) => s.id);
    try {
      await reorderSections.mutateAsync(newOrder);
    } catch {
      toast.error('Erreur lors du réordonnancement des sections');
    }
  };

  const handleAddSection = async () => {
    try {
      await addSection.mutateAsync(`Section ${sections.length + 1}`);
    } catch {
      toast.error('Erreur lors de la création de la section');
    }
  };

  return (
    <div className="bg-background">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Contenu du cours</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Organisez votre cours en sections et ressources.
        </p>
      </header>

      <main className="mx-auto py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedSections.map((section) => {
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
                          if (selection?.kind === 'pending') setSelection({ ...selection });
                        }}
                        onPendingEntryCancel={() => setSelection(null)}
                        onContentTypeSelected={(ct) =>
                          setSelection({
                            kind: 'pending',
                            contentType: ct,
                            sectionId: section.id,
                          })
                        }
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>

              <Button
                variant="outline"
                onClick={handleAddSection}
                disabled={addSection.isPending}
                className="w-full border-dashed py-5 text-muted-foreground hover:text-foreground"
              >
                {addSection.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Ajouter une section
              </Button>

              {sections.length === 0 && (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Aucune section pour le moment.
                </p>
              )}
            </aside>

            <main className="h-fit min-h-120 rounded-sm border bg-card p-4">
              <EditorPanel
                selection={selection}
                onDeselect={() => setSelection(null)}
                onCreated={(entry) => setSelection({ kind: 'existing', entry })}
              />
            </main>
          </div>
        )}
      </main>
    </div>
  );
}
