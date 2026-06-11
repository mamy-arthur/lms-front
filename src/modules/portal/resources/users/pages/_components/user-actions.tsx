"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Ban, CheckCircle, Trash2 } from "lucide-react";
import type { TenantUser } from "../../types";

interface UserActionsProps {
  user: TenantUser;
  onView: (user: TenantUser) => void;
  onEdit: (user: TenantUser) => void;
  onToggleActive: (user: TenantUser) => void;
  onDelete: (user: TenantUser) => void;
}

export function UserActions({
  user,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
}: UserActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
          aria-label={`Actions pour ${user.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(user)}>
          <Eye className="mr-2 size-3.5 text-muted-foreground" />
          Voir le détail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onToggleActive(user)}
          className={
            user.isActive
              ? "text-amber-600 focus:text-amber-600"
              : "text-emerald-600 focus:text-emerald-600"
          }
        >
          {user.isActive ? (
            <Ban className="mr-2 size-3.5" />
          ) : (
            <CheckCircle className="mr-2 size-3.5" />
          )}
          {user.isActive ? "Désactiver" : "Activer"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-3.5" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
