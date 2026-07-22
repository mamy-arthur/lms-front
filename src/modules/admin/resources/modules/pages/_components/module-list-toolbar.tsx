'use client';

import { Plus, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ModuleSearch } from '@modules/shared/components/modules';
import type { CompetencyCategory } from '../../types';

interface ModuleListToolbarProps {
  draftSearch: string;
  onDraftSearchChange: (value: string) => void;
  onSearch: () => void;
  categoryFilter: string;
  filterCategories: CompetencyCategory[];
  onCategoryFilterChange: (value: string) => void;
  onManageCategories: () => void;
  onCreateModule: () => void;
}

export function ModuleListToolbar({
  draftSearch,
  onDraftSearchChange,
  onSearch,
  categoryFilter,
  filterCategories,
  onCategoryFilterChange,
  onManageCategories,
  onCreateModule,
}: ModuleListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <ModuleSearch value={draftSearch} onChange={onDraftSearchChange} onSearch={onSearch} />
      <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {filterCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
