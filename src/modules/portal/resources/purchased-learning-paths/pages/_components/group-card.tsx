'use client';

import { Check, MoreVertical, Pencil, Trash2, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getInitials } from '@/shared/lib/string/getInitials';
import type { AssignableGroup, TenantAssignableUser } from '../../types';

interface GroupCardProps {
  group: AssignableGroup;
  members?: TenantAssignableUser[];
  enrolledUserIds?: Set<string>;
  availableCount: number;
  enrolledCount: number;
  selected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GroupCard({
  group,
  members = [],
  enrolledUserIds,
  availableCount,
  enrolledCount,
  selected,
  onClick,
  onEdit,
  onDelete,
}: GroupCardProps) {
  const isDisabled = availableCount === 0;

  return (
    // biome-ignore lint/a11y/useSemanticElements: contains nested interactive elements (dropdown)
    <div
      role="button"
      tabIndex={isDisabled ? undefined : 0}
      onClick={isDisabled ? undefined : onClick}
      onKeyDown={
        isDisabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
      }
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-all',
        isDisabled
          ? 'cursor-not-allowed border-border opacity-50'
          : selected
            ? 'cursor-pointer border-(--color-primary)/80'
            : 'cursor-pointer border-border hover:border-border/80 hover:bg-muted/40',
      )}
    >
      <div className="flex items-start gap-2">
        {members.length > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex shrink-0 -space-x-1.5 cursor-pointer"
                aria-label={`Voir les membres de ${group.name}`}
              >
                {members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} className="size-6 ring-2 ring-background">
                    <AvatarImage src={m.avatarUrl ?? undefined} alt={m.fullName} />
                    <AvatarFallback className="text-[9px] font-bold">
                      {getInitials(m.fullName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 3 && (
                  <div className="flex size-6 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[9px] font-semibold text-muted-foreground">
                    +{members.length - 3}
                  </div>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 gap-0 p-0">
              <p className="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
                {members.length} membre{members.length !== 1 ? 's' : ''}
              </p>
              <ul className="max-h-48 overflow-auto py-1">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 px-3 py-1.5">
                    <Avatar data-size="sm" className="size-6 shrink-0">
                      <AvatarImage src={m.avatarUrl ?? undefined} alt={m.fullName} />
                      <AvatarFallback className="text-[9px] font-bold">
                        {getInitials(m.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-xs">{m.fullName}</span>
                    {enrolledUserIds?.has(m.id) ? (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Inscrit
                      </span>
                    ) : selected ? (
                      <span className="shrink-0 rounded-full bg-(--color-primary)/10 px-1.5 py-0.5 text-[10px] text-(--color-primary)">
                        À inscrire
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Users className="size-3 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight">{group.name}</p>
          <p className="text-xs text-muted-foreground">
            {enrolledCount > 0 && `${enrolledCount} déjà inscrit${enrolledCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {selected && (
            <div className="flex size-4 items-center justify-center rounded-full bg-(--color-primary)">
              <Check className="size-2.5 text-white" />
            </div>
          )}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Actions pour ${group.name}`}
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 size-3.5" />
                    Modifier
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    Supprimer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {selected && availableCount > 0 && (
        <span className="inline-flex w-fit items-center gap-1 text-[10px] rounded-full border px-2 py-0.5 text-xs font-medium bg-(--color-primary)/70 text-primary-foreground">
          {availableCount === 1
            ? '+ 1 membre sera inscrit'
            : `+ ${availableCount} membres seront inscrits`}
        </span>
      )}
    </div>
  );
}
