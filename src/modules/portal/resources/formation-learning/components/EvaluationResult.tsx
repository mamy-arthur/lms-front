import { CheckCircle, RotateCcw, XCircle } from 'lucide-react';
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
  completionReason?: EvaluationCompletionReason | null;
}

export default function EvaluationResult({
  score,
  passingScore,
  maxAttempts,
  attemptsUsed,
  attemptsRemaining,
  onRetry,
  completionReason,
}: Props) {
  const passed = score >= passingScore;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-12">
      <div
        className={cn(
          'mb-6 flex size-20 items-center justify-center rounded-full',
          passed ? 'bg-emerald-500/10' : 'bg-red-500/10',
        )}
      >
        {passed ? (
          <CheckCircle className="size-10 text-emerald-500" />
        ) : (
          <XCircle className="size-10 text-red-500" />
        )}
      </div>

      <div className="text-center">
        {(completionReason === 'timeout' || completionReason === 'page_reload') && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            {completionReason === 'timeout'
              ? 'Temps écoulé : votre évaluation a été terminée automatiquement.'
              : 'Votre évaluation a été terminée automatiquement après le rechargement ou la réouverture de la page.'}{' '}
            Le résultat tient compte des réponses enregistrées.
          </p>
        )}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Résultat de l'évaluation
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {passed ? 'Félicitations ! 🎉' : 'Évaluation terminée'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {passed
            ? 'Vous avez atteint le score requis pour réussir cette évaluation.'
            : "Vous n'avez pas atteint le score requis cette fois-ci."}
        </p>
      </div>

      <div className="mt-8 w-full rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-muted-foreground">Votre score</span>
          <div
            className={cn(
              'mt-2 text-6xl font-bold tracking-tight',
              passed ? 'text-emerald-500' : 'text-red-500',
            )}
          >
            {score}%
          </div>

          <div className="mt-5 w-full max-w-sm">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Votre score</span>
              <span>Score requis : {passingScore}%</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  passed ? 'bg-emerald-500' : 'bg-red-500',
                )}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-foreground/50"
                style={{ left: `${passingScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'mt-4 w-full rounded-xl border p-4',
          passed
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
            : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20',
        )}
      >
        <div className="flex gap-3">
          {passed ? (
            <CheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
          )}
          <div>
            <p
              className={cn(
                'text-sm font-semibold',
                passed
                  ? 'text-emerald-900 dark:text-emerald-200'
                  : 'text-red-900 dark:text-red-200',
              )}
            >
              {passed ? 'Évaluation réussie' : 'Score insuffisant'}
            </p>
            <p
              className={cn(
                'mt-1 text-sm',
                passed
                  ? 'text-emerald-800/80 dark:text-emerald-300/80'
                  : 'text-red-800/80 dark:text-red-300/80',
              )}
            >
              {passed
                ? `Votre score de ${score}% est supérieur au minimum requis de ${passingScore}%.`
                : `Un score de ${passingScore}% était nécessaire pour réussir.`}
            </p>
            {maxAttempts != null && (
              <p
                className={cn('mt-1.5 text-xs', passed ? 'text-emerald-700/70' : 'text-red-700/70')}
              >
                {attemptsRemaining === 0
                  ? 'Aucune tentative restante.'
                  : `${attemptsUsed} / ${maxAttempts} tentative${maxAttempts > 1 ? 's' : ''} utilisée${maxAttempts > 1 ? 's' : ''} — ${attemptsRemaining} restante${(attemptsRemaining ?? 0) > 1 ? 's' : ''}.`}
              </p>
            )}
          </div>
        </div>
      </div>

      {!passed &&
        onRetry &&
        (attemptsRemaining === undefined ||
          attemptsRemaining === null ||
          attemptsRemaining > 0) && (
          <Button
            onClick={onRetry}
            className="mt-6 flex items-center gap-2 bg-(--color-primary) text-white hover:bg-(--color-primary)/90"
          >
            <RotateCcw className="size-4" />
            Réessayer
          </Button>
        )}
    </div>
  );
}
