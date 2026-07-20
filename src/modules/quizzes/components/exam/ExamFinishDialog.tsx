'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question, TraineeAnswer } from '../../types';

interface ExamFinishDialogProps {
  open: boolean;
  questions: Question[];
  answers: Record<string, TraineeAnswer>;
  onCancel: () => void;
  onConfirm: () => void;
}

function isAnswered(a: TraineeAnswer): boolean {
  if (a === null || a === undefined) return false;
  if (a instanceof Set) return a.size > 0;
  if (typeof a === 'object') return Object.keys(a).length > 0;
  return true;
}

export function ExamFinishDialog({
  open,
  questions,
  answers,
  onCancel,
  onConfirm,
}: ExamFinishDialogProps) {
  if (!open) return null;

  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const unanswered = questions.filter((q) => !isAnswered(answers[q.id]));

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-dialog-title"
    >
      <div
        className={cn(
          'w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-border/60 px-6 py-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="size-5 text-muted-foreground" />
          </div>
          <div>
            <h2 id="finish-dialog-title" className="text-base font-semibold text-foreground">
              Terminer le quiz ?
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Vérifiez vos réponses avant de soumettre.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-background px-6 py-4 text-center">
            <p className="text-xl font-bold text-foreground">{answeredCount}</p>
            <p className="text-xs text-muted-foreground">répondue{answeredCount > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-background px-6 py-4 text-center">
            <p
              className={cn(
                'text-xl font-bold',
                unanswered.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
              )}
            >
              {unanswered.length}
            </p>
            <p className="text-xs text-muted-foreground">sans réponse</p>
          </div>
        </div>

        {/* Unanswered list */}
        {unanswered.length > 0 && (
          <div className="border-t border-border/60 px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Questions sans réponse :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unanswered.map((q) => {
                const idx = questions.indexOf(q);
                return (
                  <span
                    key={q.id}
                    className="px-2 py-0.5 text-xs font-medium text-(--color-primary)/80"
                  >
                    Q{idx + 1}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 border-t border-border/60 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground',
              'hover:bg-muted transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Retour
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'flex-1 rounded-lg bg-(--color-primary) px-2 py-1.5 text-xs font-semibold text-primary-foreground',
              'hover:bg-(--color-primary)/85 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Soumettre le quiz
          </button>
        </div>
      </div>
    </div>
  );
}
