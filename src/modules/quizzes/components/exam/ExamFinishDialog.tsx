'use client';

import { AlertTriangle } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { cn } from '@/lib/utils';
import type { Question, TraineeAnswer } from '../../types';
import { isQuestionAnswered } from '../../utils/answer-completeness';

interface ExamFinishDialogProps {
  open: boolean;
  /** Never fall back to document.body: the exam's navigation fence owns this host. */
  container: HTMLDivElement | null;
  questions: Question[];
  answers: Record<string, TraineeAnswer>;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExamFinishDialog({
  open,
  container,
  questions,
  answers,
  onCancel,
  onConfirm,
}: ExamFinishDialogProps) {
  if (!open || !container) return null;

  const answeredCount = questions.filter((q) => isQuestionAnswered(q, answers[q.id])).length;
  const unanswered = questions.filter((q) => !isQuestionAnswered(q, answers[q.id]));

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-60 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl',
            'animate-in fade-in zoom-in-95 duration-200',
          )}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-border/60 px-6 py-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <AlertTriangle className="size-5 text-muted-foreground" />
            </div>
            <div>
              <Dialog.Title className="text-base font-semibold text-foreground">
                Terminer le quiz ?
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                Vérifiez vos réponses avant de soumettre.
              </Dialog.Description>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-px bg-border">
            <div className="bg-background px-6 py-4 text-center">
              <p className="text-xl font-bold text-foreground">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">
                répondue{answeredCount > 1 ? 's' : ''}
              </p>
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
                    <span key={q.id} className="px-2 py-0.5 text-xs font-medium text-primary/80">
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
              disabled={unanswered.length > 0}
              className={cn(
                'flex-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground',
                'hover:bg-primary/85 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              Soumettre le quiz
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
