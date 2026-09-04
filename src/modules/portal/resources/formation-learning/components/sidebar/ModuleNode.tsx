import { useState } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormationModule } from '../../lib/types';
import CourseBlock from './CourseBlock';

interface Props {
  node: FormationModule;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function ModuleNode({ node, activeId, onSelect }: Props) {
  const defaultOpen =
    node.status === 'in_progress' ||
    node.status === 'completed' ||
    node.courses.some((c) => c.sections.some((s) => s.contents.some((ct) => ct.id === activeId)));

  const [open, setOpen] = useState(defaultOpen);
  const isLocked = node.status === 'locked';

  return (
    <div className="rounded-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLocked}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors',
          isLocked ? 'cursor-not-allowed opacity-40 text-slate-400' : 'hover:bg-slate-50',
        )}
      >
        {isLocked ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
        ) : (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform',
              open && 'rotate-90',
            )}
          />
        )}
        <span className="flex-1 truncate text-muted-foreground">{node.title}</span>
      </button>

      {open && !isLocked && (
        <div className="divide-y divide-slate-100 space-y-2">
          {node.courses.map((course) => (
            <CourseBlock key={course.id} course={course} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
