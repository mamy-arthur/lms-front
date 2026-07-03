'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCourseStore } from '../../../hooks/useCouseContentStore';
import { ContentRenderer } from '@/modules/shared/components/contents/ContentRender';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContentPreviewDrawer({ open, onOpenChange }: Props) {
  const course = useCourseStore();
  const sections = course.sections;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto" showCloseButton>
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>Aperçu étudiant</SheetTitle>
          <SheetDescription>Aperçu de ce que l'étudiant voit</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 mt-2 p-2">
          {sections.map((section) => (
            <Collapsible defaultOpen key={section.id}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-4 py-3 cursor-pointer">
                <span className="font-semibold">{section.title}</span>
                <ChevronDown className="size-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col space-y-4 p-1">
                  {section.contents.map((content) => (
                    <div key={`${section.id}-${content.id}`}>
                      <ContentRenderer content={content} />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
