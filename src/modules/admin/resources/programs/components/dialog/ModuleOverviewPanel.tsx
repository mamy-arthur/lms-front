'use client';

import { BookOpen, Loader2, Route } from 'lucide-react';
import { useModuleOverview } from '@/modules/admin/resources/modules/hooks/useModuleOverview';

type Props = { moduleId: string };

export function ModuleOverviewPanel({ moduleId }: Props) {
  const { data, isLoading } = useModuleOverview(moduleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center border-t border-t-gray-100 py-4">
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200 border-t border-border bg-muted/20">
      <div className="grid grid-cols-2 gap-6 px-4 py-4 text-xs">
        {/* Courses */}
        <div className="border-r border-border pr-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-(--color-primary)" />
              <span className="font-semibold text-foreground">Cours</span>
            </div>

            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
              {data?.course_count ?? 0}
            </span>
          </div>

          {data?.courses?.length ? (
            <ul className="space-y-2">
              {data.courses.slice(0, 5).map((course) => (
                <li key={course.id} className="flex items-center gap-2 text-muted-foreground">
                  <div className="size-1 rounded-full bg-primary/60" />
                  <span className="truncate">{course.shortname}</span>
                </li>
              ))}

              {data.courses.length > 5 && (
                <li className="pl-3 text-[11px] italic text-muted-foreground">
                  +{data.courses.length - 5} autres…
                </li>
              )}
            </ul>
          ) : (
            <p className="italic text-muted-foreground text-[11px]">Aucun cours associé</p>
          )}
        </div>

        {/* Learning paths */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="size-4 text-(--color-primary)" />
              <span className="font-semibold text-foreground">Parcours</span>
            </div>

            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
              {data?.learning_path_count ?? 0}
            </span>
          </div>

          {data?.learning_paths?.length ? (
            <ul className="space-y-2">
              {data.learning_paths.slice(0, 5).map((path) => (
                <li key={path.id} className="flex items-center gap-2 text-muted-foreground">
                  <div className="size-1 rounded-full bg-primary/60" />
                  <span className="truncate">{path.name}</span>
                </li>
              ))}

              {data.learning_paths.length > 5 && (
                <li className="pl-3 text-[11px] italic text-muted-foreground">
                  +{data.learning_paths.length - 5} autres…
                </li>
              )}
            </ul>
          ) : (
            <p className="italic text-muted-foreground text-[11px]">Aucun parcours associé</p>
          )}
        </div>
      </div>
    </div>
  );
}
