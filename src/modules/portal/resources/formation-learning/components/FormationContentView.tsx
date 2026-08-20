'use client';

import ContentRenderer from './ContentRenderer';
import PortalContentRenderer from './PortalContentRenderer';
import EvaluationRunner from './EvaluationRunner';
import { getContentPosition } from '../lib/course-utils';
import type { Formation } from '../lib/types';
import type { Resolved } from '../lib/course-utils';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Props {
  formation: Formation;
  resolved: Resolved;
  onNavigate: (id: string | null) => void;
  onEvaluationComplete: (score: number, passed: boolean) => void;
  /** When provided, uses the real API entry instead of mock content.data. */
  portalEntry?: ApiPortalContentEntry | null;
  portalEntryLoading?: boolean;
}

export default function FormationContentView({
  formation,
  resolved,
  onNavigate,
  onEvaluationComplete,
  portalEntry,
  portalEntryLoading,
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
      <div className="px-6 py-5 border-b border-slate-100 shrink-0">
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

      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {usePortal ? (
          <PortalContentRenderer
            entry={portalEntry ?? undefined}
            isLoading={portalEntryLoading ?? false}
          />
        ) : (
          <ContentRenderer content={content} />
        )}
      </div>

      <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
        <Button
          onClick={() => onNavigate(prev)}
          disabled={!prev}
          className="flex items-center gap-2 rounded-sm border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-600 transition-colors"
        >
          <ArrowLeft /> Précédent
        </Button>

        <span className="text-xs text-slate-400">
          {pos.index} / {pos.total}
        </span>

        <Button
          onClick={() => onNavigate(next)}
          disabled={!next}
          className="flex items-center gap-2 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-white transition-colors"
          style={{ background: 'var(--color-primary)' }}
        >
          Suivant <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
