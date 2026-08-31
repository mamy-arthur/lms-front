import { Check, FileQuestion, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormationEvaluation } from '../../lib/types';

interface Props {
  node: FormationEvaluation;
  active: boolean;
  onSelect: () => void;
}

export default function EvaluationNode({ node, active, onSelect }: Props) {
  const isLocked = node.status === 'locked';
  const typeLabel = node.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onSelect}
      disabled={isLocked}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors',
        active ? 'font-semibold' : '',
        isLocked
          ? 'cursor-not-allowed opacity-40 text-slate-400'
          : 'hover:bg-gray-50 cursor-pointer',
      )}
      style={
        active
          ? {
              color: 'var(--color-primary)',
              background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
            }
          : undefined
      }
    >
      <FileQuestion className="h-3.5 w-3.5" />
      <span>{node.title}</span>
      <span className={`text-xs  ${typeLabel === 'Finale' ? 'text-red-500' : 'text-slate-400'}`}>
        ({typeLabel})
      </span>
      {node.status === 'completed' && !active && <Check className="h-3.5 w-3.5 text-emerald-500" />}
      {isLocked && <Lock className="h-3.5 w-3.5 text-slate-300" />}
      {node.attempt && (
        <span
          className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
            node.attempt.passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600',
          )}
        >
          {node.attempt.score}%
        </span>
      )}
    </button>
  );
}
