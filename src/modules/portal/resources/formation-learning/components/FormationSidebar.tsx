'use client';

import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { Formation, FormationModule, FormationEvaluation, FormationNode } from '../lib/types';
import ModuleNode from './sidebar/ModuleNode';
import EvaluationNode from './sidebar/EvaluationNode';
import { Button } from '@/components/ui/button';

interface Props {
  formation: Formation;
  activeId: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function FormationSidebar({
  formation,
  activeId,
  onSelect,
  collapsed,
  onToggleCollapse,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 shrink-0">
        {!collapsed && <p className="text-sm font-semibold">Sommaire</p>}
        <Button
          onClick={onToggleCollapse}
          variant={'ghost'}
          className="ml-auto flex size-7 items-center justify-center rounded-sm  transition-colors hover:bg-slate-50 hover:text-slate-600"
          aria-label={collapsed ? 'Ouvrir le sommaire' : 'Fermer le sommaire'}
        >
          {collapsed ? (
            <PanelRightOpen className="size-4 text-gray-600" />
          ) : (
            <PanelRightClose className="size-4 text-gray-600" />
          )}
        </Button>
      </div>
      {!collapsed && (
        <nav className="flex-1 min-h-0 overflow-y-auto py-4">
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
      )}
    </>
  );
}
