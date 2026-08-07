"use client";

import { Check, MoreVertical, Pencil, Trash2, Users, X } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getInitials } from "@/shared/lib/string/getInitials";
import type { AssignableGroup, TenantAssignableUser } from "../../types";

// ── UserCard ──────────────────────────────────────────────────────────────────

interface UserCardProps {
  id: string;
  fullName: string;
  pending?: boolean;
  /** Si absent, l'utilisateur est en lecture seule (déjà assigné). */
  onRemove?: () => void;
}

export function UserCard({
  fullName,
  pending = false,
  onRemove,
}: UserCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-2 transition-colors",
        pending ? "border-primary/40 bg-primary/5" : "bg-card",
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs text-black">
          {getInitials(fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{fullName}</p>
        {pending && <p className="text-xs text-primary">À ajouter</p>}
        {!pending && !onRemove && (
          <Badge
            variant="secondary"
            className="mt-0.5 h-4 px-1 text-[10px] bg-amber-500 text-white"
          >
            Déjà assigné
          </Badge>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Retirer ${fullName}`}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ── GroupCard ─────────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: AssignableGroup;
  users: TenantAssignableUser[];
  selected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MAX_VISIBLE_AVATARS = 4;

export function GroupCard({
  group,
  users,
  selected,
  onClick,
  onEdit,
  onDelete,
}: GroupCardProps) {
  const members = users.filter((u) => group.userIds.includes(u.id));
  const visible = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = members.length - MAX_VISIBLE_AVATARS;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex w-full cursor-pointer flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all",
        selected
          ? "border-(--color-primary) bg-primary/5 ring-1 ring-primary/30"
          : "hover:border-border/80 hover:bg-muted/40",
      )}
    >
      {/* Header : icône + nom + indicateur sélection + menu */}
      <div className="flex w-full items-center gap-2">
        <Users className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {group.name}
        </span>
        {selected && (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-white">
            <Check className="size-3" />
          </span>
        )}
        {(onEdit || onDelete) && (
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
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
          </div>
        )}
      </div>

      {/* Avatars membres */}
      {members.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
              className="cursor-pointer"
            >
              <AvatarGroup>
                {visible.map((u) => (
                  <Avatar key={u.id}>
                    <AvatarFallback className="text-[9px] font-semibold text-black">
                      {getInitials(u.fullName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {overflow > 0 && (
                  <AvatarGroupCount className="text-[9px]">
                    +{overflow}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 gap-0 p-0">
            <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              {members.length} membre{members.length > 1 ? "s" : ""}
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
    </div>
  );
}
