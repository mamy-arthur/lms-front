import { useState } from 'react';
import { Check, ChevronRight, FolderOpen, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormationModule } from '../../lib/types';
import SectionBlock from './SectionBlock';

interface Props {
  node: FormationModule;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function ModuleNode({ node, activeId, onSelect }: Props) {
  const defaultOpen =
    node.status === 'in_progress' ||
    node.status === 'completed' ||
    node.sections.some((s) => s.contents.some((c) => c.id === activeId));

  const [open, setOpen] = useState(defaultOpen);
  const isLocked = node.status === 'locked';

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isLocked}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold transition-colors',
          isLocked
            ? 'cursor-not-allowed opacity-40 text-slate-400'
            : 'text-slate-700 hover:bg-slate-50',
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
        <FolderOpen
          className="h-3.5 w-3.5 shrink-0"
          style={
            node.status === 'in_progress'
              ? { color: 'var(--color-primary)' }
              : node.status === 'completed'
                ? { color: '#10b981' }
                : { color: '#94a3b8' }
          }
        />
        <span className="flex-1 truncate">{node.title}</span>
        {node.status === 'completed' && <Check className="h-3 w-3 shrink-0 text-emerald-500" />}
      </button>

      {open && !isLocked && (
        <div className="ml-4 space-y-0.5 border-l border-slate-100 pl-2">
          {node.sections.map((s) => (
            <SectionBlock key={s.id} section={s} activeId={activeId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
