'use client';

import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Question, QuizAttempt, TraineeAnswer } from '../types';
import { isCorrect } from '../utils/quiz-scoring';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatElapsed(startedAt: Date, completedAt: Date): string {
  const totalSeconds = Math.max(
    0,
    Math.round((completedAt.getTime() - startedAt.getTime()) / 1000),
  );
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} h`);
  if (m > 0) parts.push(`${m} min`);
  parts.push(`${s} s`);
  return parts.join(' ');
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Terminé',
  in_progress: 'En cours',
  abandoned: 'Abandonné',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface QuizSummaryProps {
  questions: Question[];
  answers: Record<string, TraineeAnswer>;
  attempt: QuizAttempt;
  onRetry: () => void;
  /** If defined, show the retry button only when true */
  canRetry?: boolean;
}

export function QuizSummary({ questions, answers, attempt, onRetry, canRetry }: QuizSummaryProps) {
  const { startedAt, completedAt, status, pointsObtained, maxPoints, grade } = attempt;

  const passed = grade >= 70;
  const gradeFormatted = grade.toFixed(2);
  const pointsFormatted = pointsObtained.toFixed(2);
  const maxPointsFormatted = maxPoints.toFixed(2);

  const metaRows = [
    {
      icon: CalendarClock,
      label: 'Commencé le',
      value: formatDateTime(startedAt),
    },
    {
      icon: CheckCircle2,
      label: 'État',
      value: STATUS_LABELS[status] ?? status,
      highlight: true,
      passed,
    },
    ...(completedAt
      ? [
          {
            icon: CalendarCheck2,
            label: 'Complété le',
            value: formatDateTime(completedAt),
          },
          {
            icon: Clock,
            label: 'Temps écoulé',
            value: formatElapsed(startedAt, completedAt),
          },
        ]
      : []),
    {
      icon: Star,
      label: 'Points obtenus',
      value: `${pointsFormatted} / ${maxPointsFormatted}`,
    },
    {
      icon: Star,
      label: 'Note',
      value: `${gradeFormatted} %`,
      highlight: true,
      passed,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      {/* Top bar with close button */}
      <div className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-[0.5px] border-border bg-background px-6 py-3">
        <span className="text-[13px] font-[500] text-foreground">Résultat de l’évaluation</span>
        <button
          type="button"
          onClick={onRetry}
          aria-label="Fermer"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>
      {/* Score circle */}
      <div
        className={cn(
          'flex size-36 flex-col items-center justify-center rounded-full border-4 shadow-lg',
          passed
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        )}
      >
        <span className="text-4xl font-bold">{Math.round(grade)}%</span>
        <span className="text-xs font-medium opacity-70">
          {pointsFormatted} / {maxPointsFormatted}
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          {passed ? 'Bravo !' : 'Continuez vos efforts !'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {passed
            ? 'Vous avez réussi ce quiz avec succès.'
            : 'Vous pouvez recommencer pour améliorer votre score.'}
        </p>
      </div>

      {/* Attempt metadata */}
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border/60 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Détails de la tentative
          </p>
        </div>
        <dl className="divide-y divide-border/60">
          {metaRows.map(({ icon: Icon, label, value, highlight, passed: rowPassed }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-3.5 text-left">
              <Icon
                className={cn(
                  'size-4 shrink-0',
                  highlight
                    ? rowPassed
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                    : 'text-muted-foreground',
                )}
              />
              <dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
              <dd
                className={cn(
                  'flex-1 text-sm font-medium',
                  highlight
                    ? rowPassed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                    : 'text-foreground',
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Per-question recap */}
      <div className="w-full max-w-lg divide-y divide-border rounded-2xl border border-border bg-card text-left shadow-sm">
        <div className="border-b border-border/60 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Détail par question
          </p>
        </div>
        {questions.map((q, i) => {
          const ok = isCorrect(q, answers[q.id]);
          return (
            <div key={q.id} className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground">
                {i + 1}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{q.name}</p>
                {q.generalFeedback && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {q.generalFeedback}
                  </p>
                )}
              </div>
              {ok ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 size-5 shrink-0 text-rose-500" />
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {canRetry !== false && (
        <Button type="button" variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          Recommencer le quiz
        </Button>
      )}
    </div>
  );
}
