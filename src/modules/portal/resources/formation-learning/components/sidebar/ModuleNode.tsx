import { useState } from 'react';
import { ChevronDown, Lock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormationModule } from '../../lib/types';
import CourseBlock from './CourseBlock';
import { ProgressVariant } from '@/shared/components/ui/progress/Progress';

interface Props {
  node: FormationModule;
  activeId: string;
  onSelect: (id: string) => void;
  /** 1-based rank among modules only (formation `order` also counts evaluations). */
  index: number;
}

/**
 * Niveau 1 — Module. The top of the hierarchy, and the only level rendered as a
 * closed container.
 *
 * A card with its own border and ordinal badge separates one module from the next
 * on sight, which was the main thing missing: previously a module header was a
 * plain row rendered in `text-muted-foreground`, i.e. the *palest* text in a tree
 * where it should have been the strongest.
 */
export default function ModuleNode({ node, activeId, onSelect, index }: Props) {
  const containsActive = node.courses.some((c) =>
    c.sections.some((s) => s.contents.some((ct) => ct.id === activeId)),
  );

  const [open, setOpen] = useState(
    containsActive || node.status === 'in_progress' || node.status === 'completed',
  );

  const isLocked = node.status === 'locked';
  const isRetry = node.status === 'retry';
  const isDone = !isRetry && node.progress === 100;

  return (
    <section
      className={cn(
        'overflow-hidden rounded-sm border bg-white transition-colors',
        containsActive ? 'border-(--color-primary)/40 shadow-xs' : 'border-slate-200',
        isRetry && !containsActive && 'border-amber-300',
        isLocked && 'bg-slate-50/50',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLocked}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left transition-colors',
          isLocked ? 'cursor-not-allowed' : 'hover:bg-slate-50',
        )}
      >
        {/* Ordinal badge — the clearest "this is a new module" signal while scrolling. */}
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
            isLocked && 'bg-slate-100 text-slate-400',
            !isLocked && isRetry && 'bg-amber-500 text-white',
            !isLocked && !isRetry && isDone && 'bg-emerald-400 text-white',
            !isLocked &&
              !isRetry &&
              !isDone &&
              containsActive &&
              'bg-(--color-primary)/80 text-white',
            !isLocked && !isRetry && !isDone && !containsActive && 'bg-slate-100 text-slate-500',
          )}
        >
          {isLocked ? (
            <Lock className="size-3" />
          ) : isRetry ? (
            <RotateCcw className="size-3" strokeWidth={3} />
          ) : (
            index
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block text-[10.5px] font-semibold uppercase',
              isRetry ? 'text-amber-600' : 'text-slate-400',
            )}
          >
            {isRetry ? 'À refaire' : 'Module'}
          </span>
          <span
            className={cn('text-sm font-medium', isLocked ? 'text-slate-400' : 'text-slate-900')}
          >
            {node.title}
          </span>
        </span>

        {!isLocked && (
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-slate-400">
            {node.progress}%
          </span>
        )}

        {!isLocked && (
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-slate-400 transition-transform',
              !open && '-rotate-90',
            )}
          />
        )}
      </button>

      {/* Kept outside the collapsible body: module progress stays visible when closed. */}
      {!isLocked && (
        <ProgressVariant
          value={node.progress}
          indicatorColor={
            isRetry ? 'bg-amber-500' : isDone ? 'bg-emerald-400' : 'bg-(--color-primary)'
          }
          className="h-0.5 w-full rounded-none"
        />
      )}

      {open && !isLocked && (
        <div className="space-y-0.5 border-t border-slate-100 p-1.5">
          {node.courses.map((course) => (
            <CourseBlock key={course.id} course={course} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}
