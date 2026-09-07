'use client';

import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Formation, FormationModule, FormationEvaluation, FormationNode } from '../lib/types';
import ModuleNode from './sidebar/ModuleNode';
import EvaluationNode from './sidebar/EvaluationNode';

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
  let moduleCount = 0;

  // Le sidebar mobile réutilise ce composant sans passer de callback : sans ce
  // garde-fou, un bouton mort s'affichait sous la croix de fermeture du tiroir.
  const showToggle = onToggleCollapse !== undefined;

  const label = collapsed ? 'Ouvrir le sommaire' : 'Réduire le sommaire';

  const renderToggle = () => (
    <button
      type="button"
      onClick={onToggleCollapse}
      aria-label={label}
      aria-expanded={!collapsed}
      title={label}
      // Style « chrome » : transparent au repos, gris, et il ne prend de la
      // couleur qu'au survol. Le disque plein en primaire lui donnait le poids
      // d'une action principale alors que c'est une commande d'affichage.
      className={cn(
        'group flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400',
        'transition-colors hover:bg-slate-100 hover:text-(--color-primary)',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)',
      )}
    >
      {/* Doubles chevrons qui glissent vers leur destination au survol : l'icône
          joue le geste avant qu'on clique. Deux icônes distinctes plutôt qu'une
          rotation — les propriétés CSS translate/rotate se composent dans l'ordre
          translate→rotate, donc un chevron retourné partirait du mauvais côté. */}
      {collapsed ? (
        <ChevronsLeft className="size-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
      ) : (
        <ChevronsRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      )}
    </button>
  );

  return (
    <>
      {collapsed ? (
        // Mode rail (w-12) : le bouton est seul, donc centré dans la gouttière.
        showToggle && <div className="flex shrink-0 justify-center pt-2">{renderToggle()}</div>
      ) : (
        // Niveau 0 — la formation. Overline + titre large : la même grammaire
        // (libellé de niveau au-dessus du nom) que les cartes Module/Évaluation,
        // d'un cran au-dessus en taille.
        //
        // Le bouton de repli est ancré dans cette ligne d'en-tête plutôt que flottant
        // au-dessus : posé dans un coin, il se lit comme une commande de panneau et
        // non comme une action à effectuer.
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pb-3 pt-2">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase text-slate-400">Formation</p>
            <p className="mt-0.5 min-w-0 truncate text-base font-bold text-slate-900">
              {formation.title}
            </p>
          </div>
          {showToggle && renderToggle()}
        </div>
      )}

      {!collapsed && (
        <nav className="flex-1 min-h-0 overflow-y-auto" aria-label="Sommaire de la formation">
          {/* space-y-2.5 between top-level nodes: modules read as separate blocks
              rather than one continuous list of rows. */}
          <div className="space-y-2.5 px-3 pb-6">
            {formation.nodes.map((node: FormationNode) => {
              if (node.type === 'module') {
                // Modules are numbered among themselves — `node.order` counts
                // evaluations too, which would show gaps (1, 3, 6…).
                moduleCount += 1;

                return (
                  <ModuleNode
                    key={node.id}
                    node={node as FormationModule}
                    activeId={activeId}
                    onSelect={onSelect}
                    index={moduleCount}
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
