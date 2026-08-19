'use client';

import { ChevronDown, Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ModuleSearch } from '@modules/shared/components/modules';
import type { CompetencyCategory } from '../../types';

interface ModuleListToolbarProps {
  draftSearch: string;
  onDraftSearchChange: (value: string) => void;
  onSearch: () => void;
  selectedCategories: string[];
  filterCategories: CompetencyCategory[];
  onCategoryFilterChange: (value: string) => void;
  onManageCategories: () => void;
  onCreateModule: () => void;
}

export function ModuleListToolbar({
  draftSearch,
  onDraftSearchChange,
  onSearch,
  selectedCategories,
  filterCategories,
  onCategoryFilterChange,
  onManageCategories,
  onCreateModule,
}: ModuleListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ModuleSearch value={draftSearch} onChange={onDraftSearchChange} onSearch={onSearch} />
      <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-48 h-9 justify-between text-xs font-normal">
              {selectedCategories.length === 0
                ? 'Toutes les catégories'
                : `${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`}
              <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2" align="end">
            <div className="space-y-0.5">
              {filterCategories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={() => onCategoryFilterChange(cat.id)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <button
                className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                onClick={() => onCategoryFilterChange('all')}
              >
                Effacer le filtre
              </button>
            )}
          </PopoverContent>
        </Popover>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="w-full font-normal text-xs sm:w-auto"
            onClick={onManageCategories}
          >
            <Settings2 className="size-3.5" />
            Gérer les catégories
          </Button>
          <Button
            onClick={onCreateModule}
            className="w-full bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary)/80 sm:w-auto"
          >
            <Plus className="size-3.5" />
            Nouveau module
          </Button>
        </div>
      </div>
    </div>
  );
}
