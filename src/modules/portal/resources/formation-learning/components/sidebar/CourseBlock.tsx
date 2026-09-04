import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseSummary } from '../../lib/types';
import SectionBlock from './SectionBlock';

interface Props {
  course: CourseSummary;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CourseBlock({ course, activeId, onSelect }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50 transition-colors"
      >
        <ChevronRight
          className={cn('h-3 w-3 shrink-0  transition-transform', open && 'rotate-90')}
        />
        <span className="flex-1 truncate text-[13px] font-medium">{course.title}</span>
      </button>

      {open && (
        <div>
          {course.sections.map((s) => (
            <SectionBlock key={s.id} section={s} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
