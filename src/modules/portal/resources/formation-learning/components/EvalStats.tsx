import { Clock, ListChecks, CircleHelp } from 'lucide-react';

interface EvalStatsProps {
  questionCount: number;
  withTimerCount: number;
  typeCount: number;
}

export default function EvalStats({ questionCount, withTimerCount, typeCount }: EvalStatsProps) {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-4">
          <ListChecks className="size-5 text-primary" />
          <span className="text-2xl font-bold text-foreground">{questionCount}</span>
          <span className="text-xs text-muted-foreground">questions</span>
        </div>

        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-4">
          <Clock className="size-5 text-primary" />
          <span className="text-2xl font-bold text-foreground">{withTimerCount}</span>
          <span className="text-xs text-muted-foreground">avec minuterie</span>
        </div>

        <div className="col-span-2 flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-4 sm:col-span-1">
          <CircleHelp className="size-5 text-primary" />
          <span className="text-2xl font-bold text-foreground">{typeCount}</span>
          <span className="text-xs text-muted-foreground">types de questions</span>
        </div>
      </div>
    </div>
  );
}
