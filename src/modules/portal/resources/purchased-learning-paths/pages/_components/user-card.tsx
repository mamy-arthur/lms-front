'use client';

import { Check } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials } from '@/shared/lib/string/getInitials';

export type UserCardState = 'available' | 'selected' | 'group-selected' | 'enrolled';

interface UserCardProps {
  fullName: string;
  state: UserCardState;
  onClick?: () => void;
}

export function UserCard({ fullName, state, onClick }: UserCardProps) {
  const isInteractive = state === 'available' || state === 'selected';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role and handlers are conditionally set based on state
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all',
        state === 'enrolled' && 'cursor-default border-border/40 bg-muted/20 opacity-60',
        state === 'selected' &&
          'cursor-pointer border-primary/50 bg-primary/5 ring-1 ring-primary/20 hover:bg-primary/10',
        state === 'group-selected' && 'cursor-default border-primary/30 bg-primary/5',
        state === 'available' &&
          'cursor-pointer border-border hover:border-border/80 hover:bg-muted/40',
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className={cn('text-xs font-semibold', state === 'enrolled' && 'text-muted-foreground')}
        >
          {getInitials(fullName)}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          state === 'enrolled' && 'text-muted-foreground',
        )}
      >
        {fullName}
      </span>
      {state === 'selected' && (
        <>
          <Badge className="shrink-0 border-primary/20 bg-primary/10 text-xs text-primary">
            Sélectionné
          </Badge>
          <Check className="size-4 shrink-0 text-primary" />
        </>
      )}
      {state === 'group-selected' && (
        <Badge variant="secondary" className="shrink-0 text-xs text-muted-foreground">
          Via groupe
        </Badge>
      )}
      {state === 'enrolled' && (
        <Badge variant="secondary" className="shrink-0 text-xs text-muted-foreground">
          Déjà inscrit
        </Badge>
      )}
    </div>
  );
}
