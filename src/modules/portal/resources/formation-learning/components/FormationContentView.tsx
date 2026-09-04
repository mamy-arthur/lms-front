'use client';

import ContentRenderer from './ContentRenderer';
import PortalContentRenderer from './PortalContentRenderer';
import EvaluationRunner from './EvaluationRunner';
import { getContentPosition } from '../lib/course-utils';
import type { Formation } from '../lib/types';
import type { Resolved } from '../lib/course-utils';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Props {
  formation: Formation;
  resolved: Resolved;
  onNavigate: (id: string | null) => void;
  onEvaluationComplete: (score: number, passed: boolean) => void;
  /** When provided, uses the real API entry instead of mock content.data. */
  portalEntry?: ApiPortalContentEntry | null;
  portalEntryLoading?: boolean;
  onMarkComplete?: (onDone?: () => void) => void;
  isCompleting?: boolean;
  /** Required (with the resolved content's courseId) to play 'scorm' entries. */
  enrollmentId?: string;
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
}: Props) {
  if (!resolved) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-400">
        Sélectionnez un contenu.
      </div>
    );
  }

  if (resolved.kind === 'evaluation') {
    return (
      <div className="px-6 py-6">
        <EvaluationRunner
          key={resolved.node.id}
          evaluation={resolved.node}
          onComplete={onEvaluationComplete}
        />
      </div>
    );
  }

  const { content, prev, next } = resolved;
  const pos = getContentPosition(formation, content.id);
  const usePortal = portalEntry !== undefined || portalEntryLoading;

  return (
    <div className="flex flex-1 flex-col min-h-0">
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

      <div className="flex-1 px-6  overflow-y-auto">
        {usePortal ? (
          <PortalContentRenderer
            entry={portalEntry ?? undefined}
            isLoading={portalEntryLoading ?? false}
            enrollmentId={enrollmentId}
            courseId={content.courseId}
            onScormCompleted={onMarkComplete ? () => onMarkComplete() : undefined}
          />
        ) : (
          <ContentRenderer content={content} />
        )}
      </div>

      <div className="shrink-0 px-6 py-4 flex items-center justify-between">
        <Button
          onClick={() => onNavigate(prev)}
          disabled={!prev}
          className="flex items-center rounded-sm border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-600 transition-colors"
        >
          <ArrowLeft /> Précédent
        </Button>

        <span className="text-xs">
          {pos.index} / {pos.total}
        </span>

        {onMarkComplete && !content.completed ? (
          <Button
            onClick={() => onMarkComplete(next ? () => onNavigate(next) : undefined)}
            disabled={isCompleting}
            className="flex items-center gap-2 rounded-sm disabled:opacity-60 disabled:cursor-not-allowed text-xs font-medium text-white transition-colors"
            style={{ background: 'var(--color-primary)' }}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isCompleting ? 'Enregistrement…' : next ? 'Terminer et continuer' : 'Terminer'}
          </Button>
        ) : (
          // Already completed: show badge + navigate-only button.
          <div className="flex items-center gap-3">
            <Button
              onClick={() => onNavigate(next)}
              disabled={!next}
              className="flex items-center rounded-sm disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-white transition-colors"
              style={{ background: 'var(--color-primary)' }}
            >
              Suivant <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
