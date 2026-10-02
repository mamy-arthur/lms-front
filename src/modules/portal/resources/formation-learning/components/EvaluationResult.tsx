import { AlertTriangle, ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { EvaluationCompletionReason } from '@/shared/types/evaluation-attempt.types';

interface Props {
  score: number;
  passingScore: number;
  maxAttempts?: number | null;
  attemptsUsed?: number;
  attemptsRemaining?: number | null;
  onRetry?: () => void;
  /** Étape suivante (module suivant, retour au parcours…). Évite le cul-de-sac. */
  onContinue?: () => void;
  continueLabel?: string;
  completionReason?: EvaluationCompletionReason | null;
}

const clampPct = (n: number) => Math.min(Math.max(n, 0), 100);

export default function EvaluationResult({
  score,
  passingScore,
  maxAttempts,
  attemptsUsed,
  attemptsRemaining,
  onRetry,
  onContinue,
  continueLabel = 'Continuer',
  completionReason,
}: Props) {
  const passed = score >= passingScore;
  const gap = Math.max(passingScore - score, 0);

  /* ------------------------------ Attempts ------------------------------- */

  const hasAttemptLimit = maxAttempts != null;
  // Unknown or null remaining = no known limit → retry allowed (unchanged rule).
  const canRetry =
    !passed &&
    !!onRetry &&
    (attemptsRemaining === undefined || attemptsRemaining === null || attemptsRemaining > 0);
  const noAttemptsLeft = !passed && hasAttemptLimit && attemptsRemaining === 0;

  // Previous version printed "undefined / 3" or "null restante" when data was partial.
  const used =
    attemptsUsed ??
    (hasAttemptLimit && attemptsRemaining != null ? maxAttempts - attemptsRemaining : null);

  const attemptsValue = !hasAttemptLimit
    ? null
    : used != null
      ? `${used} / ${maxAttempts}`
      : attemptsRemaining != null
        ? `${attemptsRemaining} restante${attemptsRemaining > 1 ? 's' : ''}`
        : null;

  /* -------------------------- Bar marker label --------------------------- */

  const markerPct = clampPct(passingScore);
  // Keep the "Requis" label inside the bar's width near the edges.
  const markerLabelAlign =
    markerPct > 85 ? '-translate-x-full' : markerPct < 15 ? 'translate-x-0' : '-translate-x-1/2';

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-12">
      {/* Header — a single statement of the outcome */}
      <header className="flex flex-col items-center text-center">
        <div
          className={cn(
            'mb-5 flex size-14 items-center justify-center rounded-full',
            passed
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {passed ? (
            <Check className="size-7" strokeWidth={2.5} aria-hidden />
          ) : (
            <X className="size-7" strokeWidth={2.5} aria-hidden />
          )}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Résultat de l'évaluation
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {passed ? 'Évaluation réussie' : 'Évaluation non réussie'}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {passed
            ? 'Félicitations, vous avez atteint le score requis.'
            : `Il vous manquait ${gap} point${gap > 1 ? 's' : ''} pour atteindre le score requis.`}
        </p>
      </header>

      {/* Auto-completion notice — explains the score before the learner reads it */}
      {(completionReason === 'timeout' || completionReason === 'page_reload') && (
        <div
          role="status"
          className="mt-6 flex w-full gap-3 rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">
              {completionReason === 'timeout' ? 'Temps écoulé.' : 'Tentative interrompue.'}
            </span>{' '}
            {completionReason === 'timeout'
              ? 'Votre évaluation a été terminée automatiquement.'
              : 'Votre évaluation a été terminée après le rechargement ou la réouverture de la page.'}{' '}
            Le résultat tient compte des réponses enregistrées.
          </p>
        </div>
      )}

      {/* Score card */}
      <section className="mt-6 w-full rounded-sm border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Votre score</p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-foreground">{score}%</p>
          </div>
          <span
            className={cn(
              'mt-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              passed
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
            )}
          >
            {passed ? 'Réussi' : 'Non réussi'}
          </span>
        </div>

        {/* Bar with a labelled threshold marker */}
        <div className="mt-8">
          <div className="relative">
            <span
              className={cn(
                'absolute -top-5 whitespace-nowrap text-[11px] font-medium text-muted-foreground',
                markerLabelAlign,
              )}
              style={{ left: `${markerPct}%` }}
              aria-hidden
            >
              Requis {passingScore}%
            </span>
            <div
              role="meter"
              aria-label="Score obtenu"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clampPct(score)}
              aria-valuetext={`${score} %, score requis ${passingScore} %`}
              className="relative h-2.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-700',
                  passed ? 'bg-emerald-500' : 'bg-red-400',
                )}
                style={{ width: `${clampPct(score)}%` }}
              />
            </div>
            <div
              className="absolute -top-1 h-4.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground/60"
              style={{ left: `${markerPct}%` }}
              aria-hidden
            />
          </div>
          <div
            className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"
            aria-hidden
          >
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Secondary facts */}
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Score requis</dt>
            <dd className="mt-0.5 font-semibold text-foreground">{passingScore}%</dd>
          </div>
          {attemptsValue && (
            <div>
              <dt className="text-xs text-muted-foreground">Tentatives utilisées</dt>
              <dd className="mt-0.5 font-semibold text-foreground">{attemptsValue}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Actions — always offer a way forward */}
      <div className="mt-8 flex w-full flex-col items-center gap-3">
        {noAttemptsLeft && (
          <p className="text-center text-xs text-muted-foreground">
            Vous avez utilisé toutes vos tentatives pour cette évaluation.
          </p>
        )}

        <div className="flex w-full flex-col-reverse justify-center gap-3 sm:flex-row">
          {onContinue && (
            <Button
              onClick={onContinue}
              variant={canRetry ? 'outline' : 'default'}
              className={cn(
                'h-11 gap-2 sm:min-w-44',
                !canRetry && 'bg-(--color-primary) text-white hover:bg-(--color-primary)/90',
              )}
            >
              {continueLabel}
              <ArrowRight className="size-4" />
            </Button>
          )}

          {canRetry && (
            <Button
              onClick={onRetry}
              className="h-11 gap-2 bg-(--color-primary) text-white hover:bg-(--color-primary)/90 sm:min-w-44"
            >
              <RotateCcw className="size-4" />
              Réessayer
              {hasAttemptLimit && attemptsRemaining != null && (
                <span className="font-normal opacity-80">
                  ({attemptsRemaining} restante{attemptsRemaining > 1 ? 's' : ''})
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
