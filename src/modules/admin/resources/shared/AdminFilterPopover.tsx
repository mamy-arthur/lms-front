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
import type { Tenant } from "@/shared/types/tenant.types";

interface FilterOption {
  value: string;
  label: string;
}

interface AdminFilterPopoverProps {
  firstFilterLabel: string;
  firstFilterOptions: FilterOption[];
  firstFilterValue: string;
  onFirstFilterChange: (value: string) => void;
  tenants: Tenant[];
  tenantFilterValue: string;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
}

export function AdminFilterPopover({
  firstFilterLabel,
  firstFilterOptions,
  firstFilterValue,
  onFirstFilterChange,
  tenants,
  tenantFilterValue,
  onTenantFilterChange,
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
            <Label className="text-xs text-muted-foreground">
              {firstFilterLabel}
            </Label>
            <Select
              value={firstFilterValue}
              onValueChange={onFirstFilterChange}
            >
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

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tenant</Label>
            <Select
              value={tenantFilterValue}
              onValueChange={onTenantFilterChange}
            >
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
