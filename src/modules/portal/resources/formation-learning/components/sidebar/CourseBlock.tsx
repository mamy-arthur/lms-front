import { useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseSummary } from '../../lib/types';
import SectionBlock from './SectionBlock';

interface Props {
  course: CourseSummary;
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Niveau 2 — Cours. Nested inside a module card.
 *
 * Its own header carries a book icon and a medium weight, and everything below it
 * hangs off a vertical guide rail: the rail is what actually makes the depth
 * readable, and it lets a content row's accent bar sit on the branch it belongs to.
 */
export default function CourseBlock({ course, activeId, onSelect }: Props) {
  const containsActive = course.sections.some((s) => s.contents.some((c) => c.id === activeId));
  const [open, setOpen] = useState(true);

  const contentCount = course.sections.reduce((total, s) => total + s.contents.length, 0);
  // A lone untitled-ish section adds a level of noise without adding information.
  const showSectionLabels =
    course.sections.length > 1 || course.sections[0]?.title !== course.title;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'group flex w-full items-center gap-2 rounded-md py-1.5 pl-1 pr-2 text-left transition-colors hover:bg-slate-50',
          containsActive && 'bg-slate-50/60',
        )}
      >
        <ChevronRight
          className={cn(
            'size-3 shrink-0 text-slate-300 transition-transform group-hover:text-slate-500',
            open && 'rotate-90',
          )}
        />
        <BookOpen
          className={cn(
            'size-3.5 shrink-0',
            containsActive ? 'text-(--color-primary)' : 'text-slate-400',
          )}
        />
        <span
          className={cn(
            'flex-1 truncate text-[13px] font-medium',
            containsActive ? 'text-(--color-primary)' : 'text-slate-700',
          )}
        >
          {course.title}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{contentCount}</span>
      </button>

      {open && (
        // The guide rail: every section and content below belongs to this course.
        <div className={'ml-1.75 pb-1 pl-1'}>
          {course.sections.map((s) => (
            <SectionBlock
              key={s.id}
              section={s}
              activeId={activeId}
              onSelect={onSelect}
              showLabel={showSectionLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}
