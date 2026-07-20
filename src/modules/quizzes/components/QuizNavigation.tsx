'use client';

import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuizNavigationProps {
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canSubmit?: boolean;
  className?: string;
}

export function QuizNavigation({
  isFirst,
  isLast,
  onPrev,
  onNext,
  onSubmit,
  canSubmit = true,
  className,
}: QuizNavigationProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <Button type="button" variant="outline" onClick={onPrev} disabled={isFirst} className="gap-2">
        <ArrowLeft className="size-4" />
        Précédent
      </Button>

      {isLast ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="gap-2 bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/85"
        >
          <Send className="size-4" />
          Soumettre
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          className="gap-2 bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/85"
        >
          Suivant
          <ArrowRight className="size-4" />
        </Button>
      )}
    </div>
  );
}
