'use client';

import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOption {
  value: string;
  label: string;
}

interface AdminFilterPopoverProps {
  firstFilterLabel: string;
  firstFilterOptions: FilterOption[];
  firstFilterValue: string;
  onFirstFilterChange: (value: string) => void;
  onSearch: () => void;
}

export function AdminFilterPopover({
  firstFilterLabel,
  firstFilterOptions,
  firstFilterValue,
  onFirstFilterChange,
  onSearch,
}: AdminFilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="size-4" />
          Filtres
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{firstFilterLabel}</Label>
            <Select value={firstFilterValue} onValueChange={onFirstFilterChange}>
              <SelectTrigger aria-label={firstFilterLabel} className="w-full">
                <SelectValue placeholder={`Toutes les ${firstFilterLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {firstFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={onSearch}
            className="w-full bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
          >
            <Search className="size-4" />
            Appliquer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
