"use client";

import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_OPTIONS } from "@modules/shared/components/modules/constants/modules";
import type { Tenant } from "@/shared/types/tenant.types";

interface AdminModulesFilterProps {
  categoryFilter: string;
  tenantFilter: string;
  onCategoryFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminModulesFilter({
  categoryFilter,
  tenantFilter,
  onCategoryFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminModulesFilterProps) {
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

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tenant</Label>
            <Select value={tenantFilter} onValueChange={onTenantFilterChange}>
              <SelectTrigger aria-label="Filtrer par tenant" className="w-full">
                <SelectValue placeholder="Tous les tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
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
