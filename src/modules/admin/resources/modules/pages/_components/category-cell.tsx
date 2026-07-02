"use client";

import { Check, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useModuleCategoryStore } from "../../lib/module-store";
import { ModuleCategoryDrawer } from "../../components/module-category-drawer";
import type { Module } from "../../types";

interface CategoryCellProps {
  module: Module;
  onCategoryChange: (moduleId: string, newCategory: string) => void;
}

export function CategoryCell({
  module: mod,
  onCategoryChange,
}: CategoryCellProps) {
  const { categories, getLabel } = useModuleCategoryStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    if (value === mod.category) {
      setOpen(false);
      return;
    }
    setPendingCategory(value);
  };

  const confirmChange = () => {
    if (pendingCategory) {
      onCategoryChange(mod.id, pendingCategory);
      setPendingCategory(null);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 group/cell">
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200"
        >
          {getLabel(mod.category || "")}
        </Badge>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Modifier la catégorie"
            >
              <Pencil className="size-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <div className="flex items-center gap-1 border-b px-1">
                <div className="flex-1 min-w-0">
                  <CommandInput
                    placeholder="Rechercher…"
                    value={query}
                    onValueChange={setQuery}
                  />
                </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-7 px-1.5 text-xs gap-1 text-muted-foreground mr-1"
                    onClick={() => setCatDrawerOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Créer
                  </Button>
              </div>
              <CommandList>
                <CommandEmpty>
                  Aucune catégorie trouvée.
                </CommandEmpty>
                <CommandGroup>
                  {categories.map((cat) => (
                    <CommandItem
                      key={cat.id}
                      value={cat.name}
                      onSelect={() => handleSelect(cat.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          mod.category === cat.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {cat.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <AlertDialog
        open={!!pendingCategory}
        onOpenChange={(open) => {
          if (!open) setPendingCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer la catégorie</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir modifier la catégorie du module «{" "}
              {mod.name} » en « {pendingCategory ? getLabel(pendingCategory) : ""} » ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModuleCategoryDrawer
        open={catDrawerOpen}
        onOpenChange={setCatDrawerOpen}
      />
    </>
  );
}
