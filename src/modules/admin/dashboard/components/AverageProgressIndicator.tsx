'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function AverageProgressIndicator({
  value,
  variant = 'average',
  ariaLabel = 'Progression moyenne des étudiants',
}: {
  value: number;
  variant?: 'average' | 'completion';
  ariaLabel?: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let startedAt: number | undefined;
    let frameId: number;

    const animate = (timestamp: number) => {
      startedAt ??= timestamp;
      const elapsed =
        reducedMotion?.matches === false ? Math.min((timestamp - startedAt) / 900, 1) : 1;
      const eased = 1 - (1 - elapsed) ** 3;
      setProgress(value * eased);

      if (elapsed < 1) frameId = requestAnimationFrame(animate);
    };

    const handleMotionChange = () => {
      if (reducedMotion?.matches) {
        cancelAnimationFrame(frameId);
        setProgress(value);
      }
    };

    frameId = requestAnimationFrame(animate);
    reducedMotion?.addEventListener('change', handleMotionChange);

    return () => {
      cancelAnimationFrame(frameId);
      reducedMotion?.removeEventListener('change', handleMotionChange);
    };
  }, [value]);

  return (
    <>
      {variant === 'completion' ? (
        <div className="flex justify-between gap-2 text-xs">
          <span>Taux de complétion</span>
          <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
        </div>
      ) : (
        <p className="text-4xl font-semibold tracking-tight tabular-nums">
          {Math.round(progress)} <span className="text-xl">%</span>
        </p>
      )}
      <Progress
        value={progress}
        aria-label={ariaLabel}
        aria-valuetext={
          variant === 'completion'
            ? `${Math.round(progress)} % des inscrits ont terminé avec succès`
            : undefined
        }
        className={cn(
          'rounded-full **:data-[slot=progress-indicator]:rounded-full **:data-[slot=progress-indicator]:transition-none',
          variant === 'completion'
            ? 'h-1 bg-muted **:data-[slot=progress-indicator]:bg-blue-600'
            : 'h-2 bg-primary-foreground/20 **:data-[slot=progress-indicator]:bg-primary-foreground',
        )}
      />
    </>
  );
}
