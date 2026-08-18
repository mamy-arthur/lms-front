import { useState } from 'react';
import { ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseSummary } from '../../lib/types';
import SectionBlock from './SectionBlock';

interface Props {
  course: CourseSummary;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CourseBlock({ course, activeId, onSelect }: Props) {
  const defaultOpen = course.sections.some((s) => s.contents.some((c) => c.id === activeId));
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-90',
          )}
        />
        <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="flex-1 truncate">{course.title}</span>
      </button>

      {open && (
        <div className="ml-4 border-l border-slate-100 pl-2">
          {course.sections.map((s) => (
            <SectionBlock key={s.id} section={s} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
