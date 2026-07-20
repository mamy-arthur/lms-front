'use client';

import type { Formation, FormationModule, FormationEvaluation, FormationNode } from '../lib/types';
import ModuleNode from './sidebar/ModuleNode';
import EvaluationNode from './sidebar/EvaluationNode';

interface Props {
  formation: Formation;
  activeId: string;
  onSelect: (id: string) => void;
}

export default function FormationSidebar({ formation, activeId, onSelect }: Props) {
  return (
    <>
      <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-400 shrink-0">
        {formation.title}
      </div>

      <div className="px-4 py-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${formation.progress}%`, background: 'var(--color-primary)' }}
            />
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">{formation.progress}%</span>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto py-4">
        <div className="mb-3 px-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </p>
        </div>
        <div className="space-y-1 px-2">
          {formation.nodes.map((node: FormationNode) => {
            if (node.type === 'module') {
              return (
                <ModuleNode
                  key={node.id}
                  node={node as FormationModule}
                  activeId={activeId}
                  onSelect={onSelect}
                />
              );
            }
            return (
              <EvaluationNode
                key={node.id}
                node={node as FormationEvaluation}
                active={node.id === activeId}
                onSelect={() => onSelect(node.id)}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}
