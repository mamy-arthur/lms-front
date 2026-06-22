"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ModuleCategoryForm } from "./module-category-form";
import type { ModuleCategory } from "../lib/module-store";
import { useModuleCategoryStore } from "../lib/module-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: string | null;
};

export function ModuleCategoryDrawer({ open, onOpenChange, editingId }: Props) {
  const { categories } = useModuleCategoryStore();
  const [editing, setEditing] = useState<ModuleCategory | null>(null);

  useEffect(() => {
    if (open && editingId) {
      const category = categories.find((c) => c.id === editingId) ?? null;
      setEditing(category);
    } else if (!open) {
      setEditing(null);
    }
  }, [open, editingId, categories]);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setEditing(null);
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>
            {editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Modifiez les informations de la catégorie."
              : "Créez une nouvelle catégorie de module."}
          </SheetDescription>
        </SheetHeader>

        <ModuleCategoryForm
          category={editing}
          onDone={() => {
            setEditing(null);
            onOpenChange(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
