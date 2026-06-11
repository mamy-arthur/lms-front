"use client";

import {
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Module } from "../../types";

interface ModuleActionsProps {
  module: Module;
  onView: (mod: Module) => void;
  onEdit: (mod: Module) => void;
  onDelete: (mod: Module) => void;
}

export function ModuleActions({
  module: mod,
  onView,
  onEdit,
  onDelete,
}: ModuleActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
          aria-label={`Actions pour ${mod.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(mod)}>
          <Eye className="mr-2 size-3.5 text-muted-foreground" />
          Voir le détail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(mod)}>
          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(mod)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-3.5" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
