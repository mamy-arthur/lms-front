'use client';

import {
  AlertCircleIcon,
  AlertTriangle,
  AlertTriangleIcon,
  BookOpenCheck,
  Loader2,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EvaluationSplashProps {
  title: string;
  evaluationType: 'intermediate' | 'final';
  onStart: () => void;
  /** The start request itself is in flight. */
  isLoading?: boolean;
  /** The remaining-attempts data is still being fetched — nothing is decidable yet. */
  isCheckingAttempts?: boolean;
  /** The remaining-attempts data could not be fetched. */
  hasAttemptsError?: boolean;
  onRetryAttempts?: () => void;
  maxAttempts?: number | null;
  attemptsUsed?: number;
  attemptsRemaining?: number | null;
}

export default function EvaluationSplash({
  title,
  evaluationType,
  onStart,
  isLoading = false,
  isCheckingAttempts = false,
  hasAttemptsError = false,
  onRetryAttempts,
  maxAttempts,
  attemptsRemaining,
}: EvaluationSplashProps) {
  const typLabel = evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';

  // Only decidable once the data has settled. Treating `undefined` as "attempts
  // remain" made this fail *open*: the CTA rendered enabled while the quota was
  // still unknown, so learners clicked Commencer on an already-exhausted
  // evaluation and got a generic error back.
  const attemptsKnown = !isCheckingAttempts && !hasAttemptsError;
  const exhausted =
    attemptsKnown &&
    attemptsRemaining !== undefined &&
    attemptsRemaining !== null &&
    attemptsRemaining <= 0;

  // The button is only offered once we know it can actually succeed.
  const canStart = attemptsKnown && !exhausted;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10">
      {/* Header */}
      <div className="mb-4 flex flex-col items-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-sm bg-gray-100/50">
          <BookOpenCheck className="size-8 text-primary" />
        </div>

        <span className="mb-2 text-xs font-semibold uppercase  text-primary">
          Évaluation {typLabel}
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>

        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Prenez quelques instants pour lire les informations ci-dessous avant de commencer votre
          évaluation.
        </p>

        {/* Skeleton rather than nothing: an empty slot made the splash look settled
            while the quota was still unknown. */}
        {isCheckingAttempts && (
          <div className="mt-4 h-9 w-full animate-pulse rounded-md bg-slate-100" />
        )}

        {attemptsKnown && maxAttempts != null && !exhausted && (attemptsRemaining ?? 0) > 0 && (
          <div className="mt-4 w-full">
            <Alert>
              <RotateCcw className="size-3.5" />
              <AlertDescription className="text-xs">
                <span className="font-semibold">{attemptsRemaining}</span> tentative
                {(attemptsRemaining ?? 0) > 1 ? 's' : ''} restante
                {(attemptsRemaining ?? 0) > 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {/* Important information */}
      <div className="mb-4 overflow-hidden rounded-sm border bg-card">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <AlertTriangle className="size-5 text-amber-600" />
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Informations importantes</h2>
            <p className="text-sm text-muted-foreground">À lire avant de commencer</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex gap-3">
            <div className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Une fois l'évaluation commencée, assurez-vous de disposer de suffisamment de temps
              pour la terminer.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Veillez à disposer d'une connexion Internet stable pendant toute la durée de
              l'évaluation.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Vos réponses sont enregistrées au fur et à mesure de votre progression.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Vous pourrez faire l'évaluation sur votre ordinateur, tablette ou smartphone, mais il
              est recommandé d'utiliser un ordinateur pour une meilleure expérience.
            </p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-4">
        <Alert className="border-amber-200 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
          <AlertTriangleIcon />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            Assurez-vous d'être prêt avant de commencer. Le démarrage de l'évaluation peut être
            définitif.
          </AlertDescription>
        </Alert>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3">
        {isCheckingAttempts ? (
          // Placeholder occupying the CTA slot. Deliberately NOT a disabled button:
          // there is no action here, only a status. A button would sit in the
          // accessibility tree as a control that never becomes usable, and would
          // invite the very click this state exists to prevent.
          <span
            role="status"
            aria-live="polite"
            className="flex h-10 w-full max-w-sm items-center justify-center gap-2 rounded-md bg-slate-100 px-10 text-xs font-medium text-slate-500"
          >
            <Loader2 className="size-5 animate-spin" />
            Vérification de vos tentatives…
          </span>
        ) : hasAttemptsError ? (
          <Alert variant="destructive" className="border-red-200">
            <AlertCircleIcon />
            <AlertTitle>Impossible de vérifier vos tentatives</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              <span>
                Nous n'avons pas pu récupérer le nombre de tentatives restantes. Démarrer maintenant
                pourrait échouer.
              </span>
              {onRetryAttempts && (
                <Button variant="outline" size="sm" onClick={onRetryAttempts}>
                  <RotateCcw className="size-3" />
                  Réessayer
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : exhausted ? (
          <Alert variant="destructive" className="border-red-200">
            <AlertCircleIcon />
            <AlertTitle>Tentatives épuisées</AlertTitle>
            <AlertDescription>
              Vous avez utilisé toutes vos tentatives pour cette évaluation.
            </AlertDescription>
          </Alert>
        ) : (
          <Button
            onClick={onStart}
            disabled={isLoading}
            aria-busy={isLoading}
            className="h-10 w-full max-w-sm gap-2 px-10 bg-(--color-primary) text-white hover:bg-(--color-primary)/90 disabled:opacity-100"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <PlayCircle className="size-5" />
            )}
            {isLoading ? 'Démarrage…' : "Commencer l'évaluation"}
          </Button>
        )}

        {canStart && (
          <p className="text-xs text-muted-foreground">
            Vous pourrez commencer lorsque vous serez prêt.
          </p>
        )}
      </div>
    </div>
  );
}
