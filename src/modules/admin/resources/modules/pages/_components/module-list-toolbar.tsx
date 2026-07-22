'use client';

import { Check, ChevronsUpDown, Plus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ModuleSearch } from '@modules/shared/components/modules';
import type { CompetencyCategory } from '../../types';

interface ModuleListToolbarProps {
  draftSearch: string;
  onDraftSearchChange: (value: string) => void;
  onSearch: () => void;
  selectedCategories: string[];
  filterCategories: CompetencyCategory[];
  onSelectAllCategories: () => void;
  onToggleCategory: (categoryId: string) => void;
  onManageCategories: () => void;
  onCreateModule: () => void;
}

export function ModuleListToolbar({
  draftSearch,
  onDraftSearchChange,
  onSearch,
  selectedCategories,
  filterCategories,
  onSelectAllCategories,
  onToggleCategory,
  onManageCategories,
  onCreateModule,
}: ModuleListToolbarProps) {
  const [catFilterOpen, setCatFilterOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ModuleSearch value={draftSearch} onChange={onDraftSearchChange} onSearch={onSearch} />
      <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <Popover open={catFilterOpen} onOpenChange={setCatFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-label="Filtrer par catégorie"
              className="h-9 w-full justify-between font-normal text-xs sm:w-44"
            >
              {selectedCategories.includes('all') || selectedCategories.length === 0
                ? 'Toutes les catégories'
                : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(100vw-2rem,14rem)] p-0 sm:w-56">
            <Command>
              <CommandInput placeholder="Rechercher…" />
              <CommandEmpty>Aucune catégorie</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onSelectAllCategories();
                    setCatFilterOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      selectedCategories.includes('all') ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  Toutes les catégories
                </CommandItem>
                {filterCategories.map((cat) => (
                  <CommandItem
                    key={cat.id}
                    value={cat.name}
                    onSelect={() => onToggleCategory(cat.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        selectedCategories.includes(cat.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {cat.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full font-normal text-xs sm:w-auto"
            onClick={onManageCategories}
          >
            <Settings2 className="size-3.5" />
            Gérer les catégories
          </Button>
          <Button
            onClick={onCreateModule}
            className="h-9 w-full bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/80 sm:w-auto"
          >
            <Plus className="size-3.5" />
            Nouveau module
          </Button>
        </div>
      </div>
    </div>
  );
}
