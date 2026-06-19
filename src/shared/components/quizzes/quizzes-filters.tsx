"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";

export interface QuizzesFiltersProps {
  search: string;
  formationFilter: string;
  onSearchChange: (value: string) => void;
  onFormationFilterChange: (value: string) => void;
  onSearch: () => void;
  extraFields?: ReactNode;
}

export function QuizzesFilters({
  search,
  formationFilter,
  onSearchChange,
  onFormationFilterChange,
  onSearch,
  extraFields,
}: QuizzesFiltersProps) {
  return (
    <div className="bg-card pb-4 space-y-3 md:flex md:items-end md:gap-3 md:space-y-0">
      <div className="space-y-1 md:flex-1">
        <Label className="text-xs text-muted-foreground">Recherche</Label>
        <Input
          placeholder="Rechercher par titre…"
          aria-label="Rechercher"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-end gap-3 md:flex-1">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Formation</Label>
          <Select
            value={formationFilter}
            onValueChange={onFormationFilterChange}
          >
            <SelectTrigger
              aria-label="Filtrer par formation"
              className="w-full"
            >
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {MOCK_COURSES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {extraFields}
      </div>

      <Button
        size="lg"
        variant="secondary"
        onClick={onSearch}
        className="w-full md:w-auto md:self-end shrink-0"
      >
        <Search className="size-4" />
        Chercher
      </Button>
    </div>
  );
}
