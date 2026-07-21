'use client';

import { BookOpen, Calendar, Hash, Tag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/shared/lib/date';
import type { Module } from '../../types';
import { useModule } from '../../hooks/useModule';
import { useAvailableCoursesQuery } from '../../hooks/useAvailableCoursesQuery';

interface ModuleDetailDrawerProps {
  module: Module | undefined;
  open: boolean;
  onClose: () => void;
}

export function ModuleDetailDrawer({ module, open, onClose }: ModuleDetailDrawerProps) {
  const { data: detail } = useModule(
    open ? module?.idnumber : undefined,
    open ? module?.id : undefined,
  );

  const { data: availableCourses = [] } = useAvailableCoursesQuery(
    open ? module?.id : undefined,
  );

  const mod = detail ?? module;

  // Build a name lookup from available courses
  const courseNameMap = new Map(availableCourses.map((c) => [c.id, c.fullName]));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="!w-[40vw] !max-w-[40vw] overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="text-base">{mod?.shortname ?? '—'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 text-sm">
          {/* Identifiant + catégorie */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Hash className="size-3.5 shrink-0" />
              <span className="font-mono text-xs">{mod?.idnumber || '—'}</span>
            </div>
            {mod?.category && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Tag className="size-3.5 shrink-0" />
                <span className="text-xs">{mod.category}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
            {mod?.description ? (
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: mod.description }}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucune description</p>
            )}
          </div>

          <Separator />

          {/* Cours liés */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-muted-foreground shrink-0" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Cours liés ({mod?.courseIds.length ?? 0})
              </p>
            </div>
            {mod?.courseIds.length ? (
              <div className="flex flex-wrap gap-1.5">
                {mod.courseIds.map((id) => (
                  <Badge key={id} variant="secondary" className="text-xs font-normal">
                    {courseNameMap.get(id) ?? id}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Aucun cours lié</p>
            )}
          </div>

          <Separator />

          {/* Dates */}
          <div className="flex gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span>Créé le {mod?.createdAt ? formatDate(mod.createdAt) : '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span>Modifié le {mod?.updatedAt ? formatDate(mod.updatedAt) : '—'}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
