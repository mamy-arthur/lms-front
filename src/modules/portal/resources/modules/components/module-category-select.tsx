"use client";

import { Check, ChevronsUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
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
import { useModuleCategoryStore } from "../lib/module-store";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  usedCategoryIds?: Set<string>;
  onEdit: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  onUsedDeleteAttempt: (categoryId: string) => void;
  onCreate: () => void;
}

export function CategorySelect({
  value,
  onChange,
  usedCategoryIds,
  onEdit,
  onDelete,
  onUsedDeleteAttempt,
  onCreate,
}: CategorySelectProps) {
  const { categories } = useModuleCategoryStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-label="Catégorie"
            className="h-9 w-full justify-between font-normal text-xs"
          >
            {value
              ? categories.find((c) => c.id === value)?.name
              : "Sélectionner une catégorie"}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[--radix-popover-trigger-width] p-0"
        >
          <Command>
            <CommandInput placeholder="Rechercher…" />
            <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
            <CommandList>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "size-4",
                          value === category.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span>{category.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          onEdit(category.id);
                        }}
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center justify-center rounded p-0.5",
                          usedCategoryIds?.has(category.id)
                            ? "text-muted-foreground/40 cursor-not-allowed"
                            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          if (usedCategoryIds?.has(category.id)) {
                            onUsedDeleteAttempt(category.id);
                          } else {
                            onDelete(category.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
            <div
              className="flex items-center gap-1.5 border-t px-2 py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onCreate();
              }}
            >
              <Plus className="size-3.5" />
              Nouvelle catégorie
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
