import { cn } from '@/lib/utils';
import type { CourseContent } from '../../lib/types';
import StatusIcon from './StatusIcon';

interface Props {
  content: CourseContent;
  active: boolean;
  onSelect: () => void;
}

/**
 * Niveau 4 — Contenu. The only clickable destination in the tree.
 *
 * Sits at the deepest indent, against the course guide rail. When active, an
 * accent bar is drawn *on* that rail so the highlighted branch is traceable back
 * up to its course and module at a glance.
 */
export default function ContentRow({ content, active, onSelect }: Props) {
  const isLocked = content.status === 'locked';

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onSelect}
      disabled={isLocked}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex w-full items-center gap-2.5  py-1.5 pl-4 pr-2 text-left text-[13px] transition-colors',
        active
          ? 'font-medium text-(--color-primary)'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        isLocked && 'cursor-not-allowed text-slate-400 opacity-60 hover:bg-transparent',
      )}
      style={
        active
          ? { background: 'color-mix(in srgb, var(--color-primary) 7%, transparent)' }
          : undefined
      }
    >
      {/* Accent bar overlapping the parent rail — marks the active branch. */}
      {active && (
        <span className="absolute -left-px top-0.5 bottom-0.5 w-0.5 rounded-full bg-(--color-primary)" />
      )}

      <StatusIcon status={content.status} />
      <span className="flex-1 truncate">{content.title}</span>

      {content.durationMin != null && (
        <span
          className={cn(
            'shrink-0 text-[11px] tabular-nums',
            active ? 'text-(--color-primary)/70' : 'text-slate-400',
          )}
        >
          {content.durationMin} min
        </span>
      )}
    </button>
  );
}
