import { Check, ClipboardCheck, Lock, RotateCcw } from 'lucide-react';
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
  // L'obligation de repassage reste visible avant le déverrouillage du nœud.
  const isRetry = node.execution.requiredToRepeat;
  const isDone = node.status === 'completed';
  const typeLabel = node.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';
  const remaining = node.execution.round?.remaining_attempts ?? null;

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onSelect}
      disabled={isLocked}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-sm border px-2.5 py-2.5 text-left transition-colors',
        active ? 'border-(--color-primary)/50' : 'border-slate-300',
        isRetry && !active && 'border-amber-300',
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
          !isLocked && isRetry && 'bg-amber-500 text-white',
          !isLocked && !isRetry && isDone && 'bg-emerald-400 text-white',
          !isLocked && !isRetry && !isDone && 'bg-amber-50 text-amber-600',
        )}
      >
        {isLocked ? (
          <Lock className="size-3" />
        ) : isRetry ? (
          <RotateCcw className="size-3" strokeWidth={3} />
        ) : isDone ? (
          <Check className="size-2.5" strokeWidth={3} />
        ) : (
          <ClipboardCheck className="size-3.5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-[10.5px] font-semibold uppercase',
            isRetry ? 'text-amber-600' : 'text-slate-400',
          )}
        >
          {isRetry ? 'À refaire' : `Évaluation ${typeLabel}`}
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

      {!isLocked && isRetry && remaining !== null && (
        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-700">
          {remaining} restante{remaining > 1 ? 's' : ''}
        </span>
      )}
    </button>
  );
}
