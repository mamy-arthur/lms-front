'use client';

import { cn } from '@/lib/utils';

export function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-(--color-primary) text-background'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
      )}
    >
      {children}
    </button>
  );
}
