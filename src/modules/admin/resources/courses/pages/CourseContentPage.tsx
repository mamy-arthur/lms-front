'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCourseStore } from '../../../../shared/components/courses/hooks/useCouseContentStore';

import { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { CourseContent } from '../../../../shared/components/courses/types';
import { SectionCard } from '@/modules/shared/components/courses/contents/SectionCard';
import { SectionContent } from '@/modules/shared/components/courses/contents/ContentSection';
import { ContentPreviewDrawer } from '@/modules/shared/components/courses/contents/preview/components/ContentPreviewDrawer';

export function CourseContentPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const sections = useMemo(
    () => [...useCourseStore.getState().sections].sort((a, b) => a.order - b.order),
    [useCourseStore((s) => s.sections)],
  );
  const addSection = useCourseStore((s) => s.addSection);

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
          <Button
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
            onClick={() => setIsOpen(true)}
          >
            <BookOpen className="size-4" />
            Prévisualisation
          </Button>
        </div>
      </header>

      <main className="mx-auto py-8">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Navigation */}
          <aside className="space-y-3">
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                selectedContentId={selectedContent?.id}
                onSelectContent={setSelectedContent}
              />
            ))}
            <Button
              variant="outline"
              onClick={() => addSection()}
              className="w-full border-dashed py-6 text-muted-foreground hover:text-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> Ajouter une section
            </Button>
            {sections.length === 0 && (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Aucune section pour le moment.
              </p>
            )}
          </aside>

          {/* Edition */}
          <main className="min-h-125 rounded-xl border bg-card p-4">
            {selectedContent ? (
              <SectionContent
                key={selectedContent.id}
                sectionId={selectedContent.sectionId}
                content={selectedContent}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <h3 className="font-medium text-sm">Aucun contenu sélectionné</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sélectionnez un contenu dans la liste pour commencer l'édition.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </main>
      <ContentPreviewDrawer open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
