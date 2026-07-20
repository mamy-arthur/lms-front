'use client';

import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '../../types';
import type { TraineeAnswer } from '../../types';

interface ExamFooterProps {
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRequestFinish: () => void;
  questions: Question[];
  answers: Record<string, TraineeAnswer>;
  currentIndex: number;
  className?: string;
}

function isAnswered(a: TraineeAnswer): boolean {
  if (a === null || a === undefined) return false;
  if (a instanceof Set) return a.size > 0;
  if (typeof a === 'object') return Object.keys(a).length > 0;
  return true;
}

export function ExamFooter({
  isFirst,
  isLast,
  onPrev,
  onNext,
  onRequestFinish,
  questions,
  answers,
  currentIndex,
  className,
}: ExamFooterProps) {
  return (
    <footer
      className={cn(
        'sticky bottom-0 z-10 shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm',
        className,
      )}
    >
      {/* Question dot map */}
      <div className="flex items-center justify-center gap-1 border-b border-border/30 px-6 py-2">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-1">
          {questions.map((q, i) => {
            const answered = isAnswered(answers[q.id]);
            const isCurrent = i === currentIndex;
            return (
              <div
                key={q.id}
                title={`Q${i + 1}${answered ? ' — répondu' : ''}`}
                className={cn(
                  'size-2 rounded-full transition-all duration-200',
                  isCurrent
                    ? 'scale-150 bg-(--color-primary)'
                    : answered
                      ? 'bg-(--color-primary)/40'
                      : 'bg-border',
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        {/* Previous */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isFirst
              ? 'cursor-not-allowed text-muted-foreground/40'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <ArrowLeft className="size-4" />
          Précédent
        </button>

        {/* Next / Finish */}
        {isLast ? (
          <button
            type="button"
            onClick={onRequestFinish}
            className={cn(
              'flex items-center gap-2 rounded-lg bg-(--color-primary) px-6 py-2 text-sm font-semibold text-primary-foreground',
              'transition-colors hover:bg-(--color-primary)/85',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <Flag className="size-4" />
            Terminer le quiz
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className={cn(
              'flex items-center gap-2 rounded-lg bg-(--color-primary) px-6 py-2 text-sm font-semibold text-primary-foreground',
              'transition-colors hover:bg-(--color-primary)/85',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Suivant
            <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </footer>
  );
}
