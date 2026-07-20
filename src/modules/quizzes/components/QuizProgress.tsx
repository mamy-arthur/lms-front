'use client';

import { cn } from '@/lib/utils';

interface QuizProgressProps {
  current: number;
  total: number;
  answered: number;
  className?: string;
}

export function QuizProgress({ current, total, answered, className }: QuizProgressProps) {
  const progressPercent = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;
  const answeredPercent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question <span className="font-semibold text-foreground">{current + 1}</span>
          {' / '}
          <span className="font-semibold text-foreground">{total}</span>
        </span>
        <span>
          <span className="font-semibold text-foreground">{answered}</span> répondue
          {answered > 1 ? 's' : ''}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        {/* Answered fill (lighter) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-(--color-primary)/25 transition-all duration-500"
          style={{ width: `${answeredPercent}%` }}
          aria-hidden="true"
        />
        {/* Navigation fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-(--color-primary) transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          aria-label={`Progression : question ${current + 1} sur ${total}`}
        />
      </div>
    </div>
  );
}
