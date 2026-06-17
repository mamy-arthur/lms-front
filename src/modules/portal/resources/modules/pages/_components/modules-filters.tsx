"use client";

import { Search } from "lucide-react";
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
import { CATEGORY_OPTIONS } from "@/shared/constants/modules";

interface ModulesFiltersProps {
  search: string;
  categoryFilter: string;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onSearch: () => void;
}

export function ModulesFilters({
  search,
  categoryFilter,
  onSearchChange,
  onCategoryFilterChange,
  onSearch,
}: ModulesFiltersProps) {
  return (
    <div className="bg-card p-4 space-y-3 md:flex md:items-end md:gap-3 md:space-y-0">
      <div className="space-y-1 md:flex-4">
        <Label className="text-xs text-muted-foreground">Recherche</Label>
        <Input
          placeholder="Rechercher par nom ou identifiant…"
          aria-label="Rechercher"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-end gap-3 md:flex-1">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Catégorie</Label>
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger aria-label="Filtrer par catégorie" className="w-full">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
