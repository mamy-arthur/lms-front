'use client';

import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FormationStatTriggerProps {
  label: string;
  value: number;
  onClick: () => void;
}

export function FormationStatTrigger({ label, value, onClick }: FormationStatTriggerProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'group inline-flex w-full items-center justify-between rounded-md border border-transparent bg-muted/60 px-2 py-1 text-xs transition-colors',
        'hover:border-primary/25 hover:bg-primary/10 hover:text-(--color-primary)',
        'focus-visible:ring-ring/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2',
      )}
    >
      <span className="truncate text-muted-foreground group-hover:text-(--color-primary)">
        {label}
      </span>
      <span className="inline-flex items-center gap-1">
        <Badge
          variant="outline"
          className="h-5 min-w-6 justify-center rounded-full px-1.5 text-[11px]"
        >
          {value}
        </Badge>
        <ChevronRight className="size-3 text-muted-foreground group-hover:text-(--color-primary)" />
      </span>
    </button>
  );
}
