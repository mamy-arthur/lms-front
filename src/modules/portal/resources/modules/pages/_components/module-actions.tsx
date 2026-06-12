"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Module } from "../../types";

interface ModuleActionsProps {
  module: Module;
  onEdit: (mod: Module) => void;
  onDelete?: (mod: Module) => void;
}

export function ModuleActions({
  module: mod,
  onEdit,
  onDelete,
}: ModuleActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={() => onEdit(mod)}
        aria-label={`Modifier ${mod.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete?.(mod)}
        aria-label={`Supprimer ${mod.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
