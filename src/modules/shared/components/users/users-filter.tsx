'use client';

import { Search, Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
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

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
] as const;

export interface UsersFilterProps {
  roleFilter: string;
  statusFilter: string;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearch: () => void;
  roleOptions: readonly { value: string; label: string }[];
  extraFields?: ReactNode;
}

export function UsersFilter({
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearch,
  roleOptions,
  extraFields,
}: UsersFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="size-4" />
          Filtres
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rôle</Label>
            <Select value={roleFilter} onValueChange={onRoleFilterChange}>
              <SelectTrigger aria-label="Filtrer par rôle" className="w-full">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {extraFields}

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Statut</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger aria-label="Filtrer par statut" className="w-full">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={() => onSearch()}
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
