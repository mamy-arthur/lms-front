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

const STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
] as const;

export interface UsersFiltersProps {
  search: string;
  roleFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearch: () => void;
  roleOptions: readonly { value: string; label: string }[];
  extraFields?: ReactNode;
}

export function UsersFilters({
  search,
  roleFilter,
  statusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearch,
  roleOptions,
  extraFields,
}: UsersFiltersProps) {
  return (
    <div className="bg-card py-4 space-y-3 md:flex md:items-end md:gap-3 md:space-y-0">
      <div className="space-y-1 md:flex-1">
        <Label className="text-xs text-muted-foreground">Recherche</Label>
        <Input
          placeholder="Rechercher par nom ou email…"
          aria-label="Rechercher"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-end gap-3 md:flex-1">
        <div className="flex-1 space-y-1">
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

        <div className="flex-1 space-y-1">
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
