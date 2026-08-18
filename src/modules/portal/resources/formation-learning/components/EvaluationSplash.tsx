'use client';

import { AlertTriangle, BookOpenCheck, Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import EvalStats from './EvalStats';

interface EvaluationSplashProps {
  title: string;
  evaluationType: 'intermediate' | 'final';
  passingScore: number;
  questionCount: number;
  withTimerCount: number;
  typeCount: number;
  onStart: () => void;
  isLoading?: boolean;
}

export default function EvaluationSplash({
  title,
  evaluationType,
  // passingScore,
  // questionCount,
  // withTimerCount,
  // typeCount,
  onStart,
  isLoading = false,
}: EvaluationSplashProps) {
  const typLabel = evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpenCheck className="size-8 text-primary" />
        </div>

        <span className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Évaluation {typLabel}
        </span>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>

        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Prenez quelques instants pour lire les informations ci-dessous avant de commencer votre
          évaluation.
        </p>
      </div>

      {/* Important information */}
      <div className="mb-6 overflow-hidden rounded-sm border bg-card">
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
            <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Une fois l'évaluation commencée, assurez-vous de disposer de suffisamment de temps
              pour la terminer.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Veillez à disposer d'une connexion Internet stable pendant toute la durée de
              l'évaluation.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Vos réponses sont enregistrées au fur et à mesure de votre progression.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Vous pourrez faire l'évaluation sur votre ordinateur, tablette ou smartphone, mais il
              est recommandé d'utiliser un ordinateur pour une meilleure expérience.
            </p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-8 flex gap-3 rounded-sm border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Attention</p>
          <p className="text-sm leading-5 text-amber-800/80 dark:text-amber-300/80">
            Assurez-vous d'être prêt avant de commencer. Le démarrage de l'évaluation peut être
            définitif.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={onStart}
          disabled={isLoading}
          className="h-10 w-full max-w-sm gap-2 px-10 bg-(--color-primary) text-white hover:bg-(--color-primary)/90"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <PlayCircle className="size-5" />
          )}

          {isLoading ? 'Chargement…' : "Commencer l'évaluation"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Vous pourrez commencer lorsque vous serez prêt.
        </p>
      </div>
    </div>
  );
}
