import { Check, ClipboardCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormationEvaluation } from '../../lib/types';

interface Props {
  node: FormationEvaluation;
  active: boolean;
  onSelect: () => void;
}

/**
 * Niveau 1 (variante) — Évaluation. A sibling of ModuleNode in the formation tree.
 *
 * Rendered as a card of the same weight so the top level stays consistent, but
 * with a dashed border and its own icon: it is a checkpoint between modules, not
 * a module, and must not be mistaken for one.
 */
export default function EvaluationNode({ node, active, onSelect }: Props) {
  const isLocked = node.status === 'locked';
  const isDone = node.status === 'completed';
  const typeLabel = node.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onSelect}
      disabled={isLocked}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-sm border px-2.5 py-2.5 text-left transition-colors',
        active ? 'border-(--color-primary)/50' : 'border-slate-300',
        isLocked ? 'cursor-not-allowed bg-slate-50/50' : 'hover:bg-slate-50',
      )}
      style={
        active
          ? { background: 'color-mix(in srgb, var(--color-primary) 7%, transparent)' }
          : undefined
      }
    >
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full',
          isLocked && 'bg-slate-100 text-slate-400',
          !isLocked && isDone && 'bg-emerald-400 text-white',
          !isLocked && !isDone && 'bg-amber-50 text-amber-600',
        )}
      >
        {isLocked ? (
          <Lock className="size-3" />
        ) : isDone ? (
          <Check className="size-2.5" strokeWidth={3} />
        ) : (
          <ClipboardCheck className="size-3.5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-semibold uppercase text-slate-400">
          Évaluation {typeLabel}
        </span>
        <span
          className={cn(
            'block truncate text-sm',
            isLocked && 'text-slate-400',
            !isLocked && active && 'text-(--color-primary)',
            !isLocked && !active && 'text-slate-900',
          )}
        >
          {node.title}
        </span>
      </span>

      {node.attempt && (
        <span
          className={cn(
            'shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            node.attempt.passed
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-600',
          )}
        >
          {node.attempt.score}%
        </span>
      )}
    </button>
  );
}
