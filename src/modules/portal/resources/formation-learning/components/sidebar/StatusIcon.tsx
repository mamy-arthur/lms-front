import { Check, Lock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProgressStatus } from '../../lib/types';

/**
 * Leaf-level status marker (niveau 4 — Contenu).
 *
 * Deliberately small and low-contrast: content rows are the deepest level of the
 * tree, so their marker must stay lighter than the module/course headers above
 * them. A heavy chip here makes the leaves look like the most important element
 * and flattens the whole hierarchy.
 */
export default function StatusIcon({ status }: { status: ProgressStatus }) {
  const base = 'flex size-4 shrink-0 items-center justify-center rounded-full';

  if (status === 'completed') {
    return (
      <span className={cn(base, 'bg-emerald-500/90')}>
        <Check className="size-2.5 text-white" strokeWidth={3} />
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span className={cn(base, 'bg-(--color-primary)')}>
        <Play className="size-2 fill-white text-white" />
      </span>
    );
  }

  if (status === 'locked') {
    return (
      <span className={cn(base, 'bg-slate-200')}>
        <Lock className="size-2.5 text-slate-400" />
      </span>
    );
  }

  // Available but not started — an empty ring, so untouched items read as "to do"
  // rather than competing with the completed ones.
  return <span className={cn(base, 'border-[1.5px] border-slate-300 bg-white')} />;
}
