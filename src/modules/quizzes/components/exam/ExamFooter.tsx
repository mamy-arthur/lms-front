'use client';

import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '../../types';
import type { TraineeAnswer } from '../../types';
import { Button } from '@/components/ui/button';

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

/** Checks completeness rules per question type (matching requires all pairs). */
function isCurrentQuestionAnswered(question: Question, answer: TraineeAnswer): boolean {
  switch (question.type) {
    case 'true_false':
      return answer !== null && answer !== undefined;
    case 'single_choice':
      return !!answer;
    case 'multiple_choice':
      return answer instanceof Set && answer.size > 0;
    case 'matching': {
      if (!answer || typeof answer !== 'object' || answer instanceof Set) return false;
      const matched = Object.values(answer as Record<string, string>).filter(Boolean).length;
      return matched === question.pairs.length;
    }
    default:
      return true;
  }
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
  const currentQuestion = questions[currentIndex];
  const canAdvance = currentQuestion
    ? isCurrentQuestionAnswered(currentQuestion, answers[currentQuestion.id])
    : true;

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
        <Button onClick={onPrev} disabled={isFirst} variant={'ghost'}>
          <ArrowLeft className="size-4" />
          Précédent
        </Button>

        {/* Next / Finish */}
        {isLast ? (
          <Button
            onClick={onRequestFinish}
            disabled={!canAdvance}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            <Flag className="size-4" />
            Terminer le quiz
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canAdvance}
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
