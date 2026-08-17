'use client';

import { X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/lib/date';
import { getInitials } from '@/shared/lib/string/getInitials';

export type StagiaireChipStatus = 'already-enrolled' | 'will-enroll';

interface StagiaireChipProps {
  name: string;
  status: StagiaireChipStatus;
  enrolledAt?: string;
  isReEnrollment?: boolean;
  onRemove?: () => void;
  onSelect?: () => void;
}

export function StagiaireChip({
  name,
  status,
  enrolledAt,
  isReEnrollment = false,
  onRemove,
  onSelect,
}: StagiaireChipProps) {
  const isWillEnroll = status === 'will-enroll';
  const isSelectable = !isWillEnroll && Boolean(onSelect);
  return (
    <div
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onClick={isSelectable ? onSelect : undefined}
      onKeyDown={
        isSelectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
      className={cn(
        'flex items-center gap-2.5 rounded-lg border bg-card p-3 text-left transition-all',
        isWillEnroll
          ? 'border-(--color-primary)/30 bg-(--color-primary)/5'
          : isSelectable
            ? 'border-border opacity-60 cursor-pointer hover:opacity-100 hover:border-(--color-primary)/40'
            : 'border-border opacity-60',
      )}
    >
      <Avatar className="size-5 shrink-0">
        <AvatarFallback
          className="text-[9px] font-bold"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold leading-tight">{name}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {isWillEnroll && (
            <span className="inline-block size-[6px] shrink-0 rounded-full bg-(--color-primary)" />
          )}
          {isWillEnroll
            ? isReEnrollment
              ? 'à réinscrire'
              : 'à inscrire'
            : enrolledAt
              ? `Inscrit le ${formatDate(enrolledAt)}`
              : 'inscrit'}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Retirer ${name}`}
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
