'use client';

import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '../../types';
import type { TraineeAnswer } from '../../types';
import { Button } from '@/components/ui/button';
import { isQuestionAnswered } from '../../utils/answer-completeness';

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
  disabled?: boolean;
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
  disabled = false,
}: ExamFooterProps) {
  const allAnswered = questions.every((question) =>
    isQuestionAnswered(question, answers[question.id]),
  );

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
            const answered = isQuestionAnswered(q, answers[q.id]);
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
                      ? 'bg-primary/40'
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
        <Button onClick={onPrev} disabled={isFirst || disabled} variant={'ghost'}>
          <ArrowLeft className="size-4" />
          Précédent
        </Button>

        {/* Next / Finish */}
        {isLast ? (
          <Button
            onClick={onRequestFinish}
            disabled={!allAnswered || disabled}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            <Flag className="size-4" />
            Terminer le quiz
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={disabled}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            Suivant
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </footer>
  );
}
