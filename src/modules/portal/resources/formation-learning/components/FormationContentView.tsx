'use client';

import ContentRenderer from './ContentRenderer';
import PortalContentRenderer from './PortalContentRenderer';
import EvaluationRunner from './EvaluationRunner';
import { getContentPosition } from '../lib/course-utils';
import type { Formation } from '../lib/types';
import type { Resolved } from '../lib/course-utils';
import type { ApiPortalContentEntry } from '@/shared/types/portal.types';

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
        <EvaluationRunner evaluation={resolved.node} onComplete={onEvaluationComplete} />
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
      </div>

      <div className="flex-1 min-h-0 px-6 py-6 overflow-y-auto">
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
        <button
          type="button"
          onClick={() => onNavigate(prev)}
          disabled={!prev}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-slate-600 transition-colors"
        >
          ← Précédent
        </button>

        <span className="text-xs text-slate-400">
          {pos.index} / {pos.total}
        </span>

        <button
          type="button"
          onClick={() => onNavigate(next)}
          disabled={!next}
          className="flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
          style={{ background: 'var(--color-primary)' }}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
