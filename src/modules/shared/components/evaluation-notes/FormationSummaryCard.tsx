'use client';

import { ChevronRight } from 'lucide-react';
import type { FormationSummary } from '@/modules/shared/lib/evaluation-notes';
import { learningPathCover } from '@/shared/lib/learning-path-cover';

/**
 * Minimum number of trainees required to display a semantic success color.
 * Below this threshold the bar and percentage are shown in neutral gray,
 * preventing a single-trainee result from reading like a meaningful aggregate.
 */
export const MIN_SAMPLE_FOR_COLOR = 2;

// ─── Component ────────────────────────────────────────────────────────────────

export interface FormationSummaryCardProps {
  formation: FormationSummary;
  onClick: () => void;
}

export function FormationSummaryCard({ formation, onClick }: FormationSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/card flex w-full cursor-pointer flex-col border rounded-sm border-border/60 bg-card text-left  transition-all duration-200 hover:border-border  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3 p-4">
        {/* Cover thumbnail */}
        <div className="size-10 shrink-0 overflow-hidden rounded-sm bg-muted">
          <img
            src={learningPathCover(formation.coverImage)}
            alt={formation.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Title + category */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="line-clamp-2 text-[14px] font-medium leading-snug text-foreground">
            {formation.name}
          </p>
          {formation.category && (
            <p className="text-[12px] text-muted-foreground">{formation.category}</p>
          )}
        </div>

        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/30 transition-colors group-hover/card:text-muted-foreground/70" />
      </div>

      {/* ── Secondary stats ── */}
      <div className="flex border-t border-border/60">
        <div className="flex flex-1 flex-col items-center gap-0.5 px-3 py-3">
          <span className="text-[15px] font-medium tabular-nums text-foreground">
            {formation.traineeCount}
          </span>
          <span className="text-[10px] text-muted-foreground">
            stagiaire{formation.traineeCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="w-px self-stretch bg-border/60" />

        <div className="flex flex-1 flex-col items-center gap-0.5 px-3 py-3">
          <span className="text-[15px] font-medium tabular-nums text-foreground">
            {formation.evaluationCount}
          </span>
          <span className="text-[10px] text-muted-foreground">
            évaluation{formation.evaluationCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="w-px self-stretch bg-border/60" />

        <div className="flex flex-1 flex-col items-center gap-0.5 px-3 py-3">
          <span className="text-[15px] font-medium tabular-nums text-foreground">
            {formation.avgScore}%
          </span>
          <span className="text-[10px] text-muted-foreground">score moyen</span>
        </div>
      </div>
    </button>
  );
}
