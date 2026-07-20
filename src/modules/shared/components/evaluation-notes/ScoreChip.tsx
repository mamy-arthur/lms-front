import { cn } from '@/lib/utils';
import { computeScoreSummary } from '@/modules/shared/lib/evaluation-notes';

interface ScoreChipProps {
  pointsEarned: number;
  pointsMax: number;
  className?: string;
}

export function ScoreChip({ pointsEarned, pointsMax, className }: ScoreChipProps) {
  const summary = computeScoreSummary(pointsEarned, pointsMax);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-medium ',
        summary.isSuccess ? ' text-emerald-500' : ' text-red-500',
        className,
      )}
    >
      <span className="font-semibold">
        {summary.pointsEarned}/{summary.pointsMax}
      </span>
      <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
        {summary.percentage}%
      </span>
    </span>
  );
}
