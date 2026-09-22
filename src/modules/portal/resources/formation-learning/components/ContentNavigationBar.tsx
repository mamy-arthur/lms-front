'use client';

import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  /** 1-based position of the current content in the full sequence. */
  index: number;
  total: number;
  prev: string | null;
  next: string | null;
  isNextLocked?: boolean;
  onNavigate: (id: string | null) => void;
  /** Already validated — the primary action becomes plain navigation. */
  isCompleted: boolean;
  /** Absent quand la visite n'autorise aucune écriture. */
  onMarkComplete?: () => void;
  isCompleting?: boolean;
}

/**
 * Action bar under the content viewer: progression readout on the left, previous /
 * validate-or-next on the sides.
 *
 * Laid out as a 3-column grid rather than `justify-between` so the centre readout
 * stays put while the right-hand button changes label and width between its
 * states — with `justify-between` the whole row shifted on every transition.
 */
export default function ContentNavigationBar({
  index,
  total,
  prev,
  next,
  isNextLocked = false,
  onNavigate,
  isCompleted,
  onMarkComplete,
  isCompleting = false,
}: Props) {
  const canValidate = onMarkComplete !== undefined && !isCompleted;
  const progress = total > 0 ? Math.round((index / total) * 100) : 0;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white/80 px-6 py-3 backdrop-blur-sm mt-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* ── Précédent ─────────────────────────────────────────────────── */}
        <div className="justify-self-start">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate(prev)}
            // Also disabled while saving: navigating away mid-request would drop
            // the pending completion without the learner noticing.
            disabled={!prev || isCompleting}
            className="h-9  px-3"
          >
            <ArrowLeft className="size-4" />
            Précédent
          </Button>
        </div>

        {/* ── Progression ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-medium tabular-nums text-slate-500">
            Contenu {index} / {total}
          </span>
          <div
            className="h-1 w-24 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression dans la formation"
          >
            <div
              className="h-full rounded-full bg-(--color-primary) transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Valider / Suivant ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 justify-self-end">
          {isCompleted && (
            <span
              role="status"
              className="flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-2 text-[11px] font-semibold text-emerald-700"
            >
              <Check className="size-3" strokeWidth={3} />
              Terminé
            </span>
          )}

          {canValidate ? (
            <Button
              size="lg"
              onClick={() => onMarkComplete()}
              disabled={isCompleting}
              aria-busy={isCompleting}
              className={cn(
                'h-9 px-4 bg-(--color-primary) hover:bg-(--color-primary)/80',
                // disabled:opacity-50 from the base variant would grey the button
                // out during the save and make it look broken rather than busy.
                isCompleting && 'disabled:opacity-100',
              )}
            >
              {/* The label stays identical while saving — only the icon swaps.
                  Swapping the text too resized the button mid-click, which is
                  what made the pending state read as a glitch instead of a wait. */}
              {isCompleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {next ? 'Terminer et continuer' : 'Terminer'}
            </Button>
          ) : (
            <Button
              size={'lg'}
              onClick={() => onNavigate(next)}
              disabled={!next || isNextLocked || isCompleting}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80"
            >
              Suivant
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
