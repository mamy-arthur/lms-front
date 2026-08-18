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
      <nav className="flex-1 min-h-0 overflow-y-auto py-4">
        <div className="mb-3 px-4">
          <p className="text-sm font-semibold">Sommaire</p>
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
