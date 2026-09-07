'use client';

import { Ban, CheckCircle, Eye, MoreHorizontal, Pencil, ShieldOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface UserActionsProps {
  isActive: boolean;
  userLabel: string;
  onView?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  /** Réservé au SuperAdmin : omettre la prop masque l'entrée. */
  onResetTwoFactor?: () => void;
}

export function UserActions({
  isActive,
  userLabel,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
  onResetTwoFactor,
}: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
          aria-label={`Actions pour ${userLabel}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {onView && (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 size-3.5 text-muted-foreground" />
            Voir le détail
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 size-3.5 text-muted-foreground" />
            Modifier
          </DropdownMenuItem>
        )}
        {onView && onEdit && <DropdownMenuSeparator />}
        {onToggleActive && (
          <>
            {!onView && !onEdit ? null : <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={onToggleActive}
              className={
                isActive
                  ? 'text-amber-600 focus:text-amber-600'
                  : 'text-emerald-600 focus:text-emerald-600'
              }
            >
              {isActive ? (
                <Ban className="mr-2 size-3.5" />
              ) : (
                <CheckCircle className="mr-2 size-3.5" />
              )}
              {isActive ? 'Désactiver' : 'Activer'}
            </DropdownMenuItem>
          </>
        )}
        {onResetTwoFactor && (
          <DropdownMenuItem onClick={onResetTwoFactor}>
            <ShieldOff className="mr-2 size-3.5 text-muted-foreground" />
            Réinitialiser le 2FA
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 size-3.5" />
            Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
