'use client';

import { BookOpenCheck, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EvalStats from './EvalStats';

interface EvaluationSplashProps {
  title: string;
  evaluationType: 'intermediate' | 'final';
  passingScore: number;
  questionCount: number;
  withTimerCount: number;
  typeCount: number;
  onStart: () => void;
}

export default function EvaluationSplash({
  title,
  evaluationType,
  passingScore,
  questionCount,
  withTimerCount,
  typeCount,
  onStart,
}: EvaluationSplashProps) {
  const typLabel = evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/8">
        <BookOpenCheck className="size-10 text-primary" />
      </div>

      <div className="space-y-3">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary">
          Évaluation {typLabel}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {passingScore > 0 && (
          <p className="text-base leading-relaxed text-muted-foreground">
            Score minimum requis pour valider : <strong>{passingScore}%</strong>
          </p>
        )}
      </div>

      <EvalStats
        questionCount={questionCount}
        withTimerCount={withTimerCount}
        typeCount={typeCount}
      />

      <Button
        type="button"
        size="lg"
        onClick={onStart}
        className="gap-2 bg-(--color-primary) px-10 text-primary-foreground hover:bg-(--color-primary)/85"
      >
        <PlayCircle className="size-5" />
        Commencer l'évaluation
      </Button>
    </div>
  );
}
