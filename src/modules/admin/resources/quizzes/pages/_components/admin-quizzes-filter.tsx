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
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import type { Tenant } from "@/shared/types/tenant.types";

interface AdminQuizzesFilterProps {
  formationFilter: string;
  tenantFilter: string;
  onFormationFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
}

export function AdminQuizzesFilter({
  formationFilter,
  tenantFilter,
  onFormationFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
}: AdminQuizzesFilterProps) {
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
            <Label className="text-xs text-muted-foreground">Formation</Label>
            <Select value={formationFilter} onValueChange={onFormationFilterChange}>
              <SelectTrigger aria-label="Filtrer par formation" className="w-full">
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
