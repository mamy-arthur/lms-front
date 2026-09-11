'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course } from '@/modules/shared/components/courses/types';

export function CourseRow({
  course,
  isPending,
  isAlreadyAdded,
  onToggle,
}: {
  course: Course;
  isPending: boolean;
  isAlreadyAdded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={isAlreadyAdded}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-xs transition-colors',
        isAlreadyAdded
          ? 'cursor-default opacity-60'
          : isPending
            ? 'border-(--color-primary) bg-primary/5'
            : 'hover:bg-muted/50',
      )}
    >
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded border',
          isPending
            ? 'border-(--color-primary) bg-(--color-primary) text-primary-foreground'
            : 'border-input',
          isAlreadyAdded && 'border-muted-foreground/30',
        )}
      >
        {isPending && <Check className="size-3" />}
      </span>

      <span className="flex-1 truncate font-medium">{course.fullName}</span>

      {course.categoryName && (
        <span className="shrink-0 text-muted-foreground">{course.categoryName}</span>
      )}

      {isAlreadyAdded && (
        <span className="ml-auto shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Déjà ajouté
        </span>
      )}
    </button>
  );
}
