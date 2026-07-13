'use client';

import { X, Check, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { FormationGroup, TenantAssignableUser } from '../../types';
import { getInitials } from '@/shared/lib/string/getInitials';

// ── UserCard ──────────────────────────────────────────────────────────────────

interface UserCardProps {
  id: string;
  fullName: string;
  pending?: boolean;
  onRemove: () => void;
}

export function UserCard({ fullName, pending = false, onRemove }: UserCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-2 transition-colors',
        pending ? 'border-primary/40 bg-primary/5' : 'bg-card',
      )}
    >
      <Avatar className={cn('size-8 shrink-0')}>
        <AvatarFallback className={cn('text-xs  text-black')}>
          {getInitials(fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{fullName}</p>
        {pending && <p className="text-xs text-primary">À ajouter</p>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Retirer ${fullName}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ── GroupCard ─────────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: FormationGroup;
  users: TenantAssignableUser[];
  selected: boolean;
  onClick: () => void;
}

const MAX_VISIBLE_AVATARS = 4;

export function GroupCard({ group, users, selected, onClick }: GroupCardProps) {
  const members = users.filter((u) => group.userIds.includes(u.id));
  const visible = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = members.length - MAX_VISIBLE_AVATARS;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex w-full cursor-pointer flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all',
        selected
          ? 'border-(--color-primary) bg-primary/5 ring-1 ring-primary/30'
          : 'hover:border-border/80 hover:bg-muted/40',
      )}
    >
      {selected && (
        <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-(--color-primary) text-white">
          <Check className="size-3" />
        </span>
      )}
      <div className="flex items-center gap-2">
        <Users className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-xs font-medium">{group.name}</span>
      </div>
      {members.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
              className="cursor-pointer"
            >
              <AvatarGroup>
                {visible.map((u) => (
                  <Avatar key={u.id}>
                    <AvatarFallback className="text-[9px] text-black font-semibold">
                      {getInitials(u.fullName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {overflow > 0 && (
                  <AvatarGroupCount className="text-[9px]">+{overflow}</AvatarGroupCount>
                )}
              </AvatarGroup>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 gap-0 p-0">
            <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              {members.length} membre{members.length > 1 ? 's' : ''}
            </p>
            <ul className="max-h-48 overflow-auto py-1">
              {members.map((u) => (
                <li key={u.id} className="flex items-center gap-2 px-3 py-1.5">
                  <Avatar>
                    <AvatarFallback className="text-[9px] font-semibold">
                      {getInitials(u.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs">{u.fullName}</span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </button>
  );
}
