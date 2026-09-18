'use client';

import PortalContentRenderer from './PortalContentRenderer';
import EvaluationRunner from './EvaluationRunner';
import { getContentPosition } from '../lib/course-utils';
import type { Formation } from '../lib/types';
import type { Resolved } from '../lib/course-utils';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';
import ContentNavigationBar from './ContentNavigationBar';
import type { RegisterScormSession } from '../lib/scormRuntime';

interface Props {
  formation: Formation;
  resolved: Resolved;
  onNavigate: (id: string | null) => void;
  onEvaluationComplete: (score: number, passed: boolean) => void;
  portalEntry: ApiPortalContentEntry | null;
  portalEntryLoading: boolean;
  onMarkComplete: (onDone?: () => void) => void;
  isCompleting: boolean;
  enrollmentId: string;
  /** Contexte du nœud actif ; `null` quand aucune visite n'est ouverte. */
  executionContext: ExecutionMutationContext | null;
  /**
   * `false` quand le nœud n'est pas `actionable` : l'historique reste lisible,
   * mais aucune écriture n'est proposée.
   */
  canMutate: boolean;
  onExecutionConflict: (error: unknown) => void;
  registerScormSession?: RegisterScormSession;
}

export default function FormationContentView({
  formation,
  resolved,
  onNavigate,
  onEvaluationComplete,
  portalEntry,
  portalEntryLoading,
  onMarkComplete,
  isCompleting,
  enrollmentId,
  executionContext,
  canMutate,
  onExecutionConflict,
  registerScormSession,
}: Props) {
  if (!resolved) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-slate-400">
        Sélectionnez un contenu.
      </div>
    );
  }

  if (resolved.kind === 'evaluation') {
    // Scrollable, comme la vue contenu : le splash puis le quiz dépassent
    // largement le cadre, et sans ce conteneur ils étaient simplement rognés par
    // l'overflow-hidden du parent — le bouton « Commencer » devenait inatteignable.
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <EvaluationRunner
          key={resolved.node.id}
          evaluation={resolved.node}
          enrollmentId={enrollmentId}
          executionContext={executionContext}
          onComplete={onEvaluationComplete}
        />
      </div>
    );
  }

  const { content, prev, next } = resolved;
  const pos = getContentPosition(formation, content.id);
  const readExecutionId = resolved.node.execution.readExecutionId;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* `flex-1 min-h-0` plutôt qu'une hauteur en vh : la zone prend exactement
          la place laissée par la barre d'action, quelle que soit la hauteur de
          celle-ci. Avec 80vh figés + la barre en dessous, le total dépassait le
          cadre de 85vh du <main> et la barre finissait rognée.
          `min-h-0` est indispensable — sans lui un enfant flex refuse de
          rétrécir sous sa taille de contenu et le scroll ne s'active jamais. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="px-6 py-3 shrink-0">
          <h1 className="text-xl font-bold text-slate-800">
            {(portalEntry?.data?.title as string | undefined) ?? content.title}
          </h1>
          {(() => {
            const desc =
              (portalEntry?.data?.description as string | undefined) ??
              (portalEntry?.data?.describe as string | undefined);
            return desc ? <p className="mt-2 text-sm  leading-relaxed">{desc}</p> : null;
          })()}
        </div>

        <div className="flex-1 px-6 ">
          <PortalContentRenderer
            key={`${enrollmentId}:${content.id}:${readExecutionId ?? ''}`}
            entry={portalEntry ?? undefined}
            isLoading={portalEntryLoading}
            enrollmentId={enrollmentId}
            competencyId={content.competencyId}
            courseId={content.courseId}
            nodeExecutionId={readExecutionId}
            expectedStateRevision={formation.execution.stateRevision}
            readOnly={!canMutate || content.completed}
            onScormCompleted={canMutate ? () => onMarkComplete() : undefined}
            onScormExecutionConflict={onExecutionConflict}
            registerScormSession={registerScormSession}
          />
        </div>
      </div>

      <ContentNavigationBar
        index={pos.index}
        total={pos.total}
        prev={prev}
        next={next}
        isNextLocked={resolved.isNextLocked}
        onNavigate={onNavigate}
        isCompleted={content.completed === true}
        onMarkComplete={canMutate ? onMarkComplete : undefined}
        isCompleting={isCompleting}
      />
    </div>
  );
}
