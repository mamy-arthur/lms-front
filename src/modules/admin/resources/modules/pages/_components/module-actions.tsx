'use client';

import { Copy, Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ModuleActionsProps {
  moduleLabel: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  /** Module frozen by a sale — editing and deleting are refused server-side. */
  locked?: boolean;
  /** Names the module and learning path behind the lock. */
  lockReason?: string;
}

export function ModuleActions({
  moduleLabel,
  onEdit,
  onDuplicate,
  onDelete,
  locked = false,
  lockReason,
}: ModuleActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
          aria-label={`Actions pour ${moduleLabel}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem disabled={locked} onClick={() => onEdit?.()}>
          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
          Modifier
        </DropdownMenuItem>
        {/* Duplicating produces a NEW module, so a sale never blocks it. */}
        <DropdownMenuItem onClick={() => onDuplicate?.()}>
          <Copy className="mr-2 size-3.5 text-muted-foreground" />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={locked}
          onClick={() => onDelete?.()}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-3.5" />
          Supprimer
        </DropdownMenuItem>
        {locked && lockReason && (
          // A caption rather than a tooltip: a disabled menu item never receives
          // the hover Radix would need to open one.
          <p className="flex items-start gap-1.5 border-t px-2 py-2 text-[11px] leading-snug text-muted-foreground">
            <Lock className="mt-0.5 size-3 shrink-0" />
            <span>{lockReason}</span>
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
