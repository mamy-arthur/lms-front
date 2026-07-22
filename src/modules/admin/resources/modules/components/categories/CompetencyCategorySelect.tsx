'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCompetencyCategoriesQuery } from '../../hooks/useCompetencyCategoriesQuery';

interface CompetencyCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
  disabled?: boolean;
}

export function CompetencyCategorySelect({
  value,
  onChange,
  onCreate,
  disabled = false,
}: CompetencyCategorySelectProps) {
  const { data: categories = [], isLoading } = useCompetencyCategoriesQuery();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-label="Catégorie"
            disabled={disabled}
            className="h-9 w-full justify-between font-normal text-xs"
          >
            {value ? categories.find((c) => c.id === value)?.name : 'Sélectionner une catégorie'}
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
            <CommandEmpty>{isLoading ? 'Chargement...' : 'Aucune catégorie trouvée.'}</CommandEmpty>
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
                          'size-4',
                          value === category.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span>{category.name}</span>
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
              Créer
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
