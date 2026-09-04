'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Formation, FormationModule, FormationEvaluation, FormationNode } from '../lib/types';
import ModuleNode from './sidebar/ModuleNode';
import EvaluationNode from './sidebar/EvaluationNode';
import { Button } from '@/components/ui/button';
import { ProgressVariant } from '@/shared/components/ui/progress/Progress';

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
      <div className="flex items-center ml-2 ">
        <Button
          onClick={onToggleCollapse}
          variant={'default'}
          className="flex size-7 items-center justify-center transition-colors bg-(--color-primary) hover:bg-(--color-primary)/80 rounded-full text-white"
          aria-label={collapsed ? 'Ouvrir le sommaire' : 'Fermer le sommaire'}
        >
          {collapsed ? (
            <ArrowLeft className="size-3 text-white" />
          ) : (
            <ArrowRight className="size-3 text-white" />
          )}
        </Button>
      </div>
      {!collapsed && (
        <div className="shrink-0  px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-lg font-semibold text-slate-800">
              {formation.title}
            </p>
          </div>

          <div className="mt-2 rounded-sm border border-slate-100  p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
                <span className="text-xs font-medium text-slate-500">
                  Progression sur la formation
                </span>
              </div>
              <span className="text-xs font-medium text-slate-700">{formation.progress}%</span>
            </div>

            <ProgressVariant value={formation.progress} className="h-1 w-full" />
          </div>
        </div>
      )}

      {!collapsed && (
        <nav className="flex-1 min-h-0 overflow-y-auto">
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
