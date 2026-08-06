'use client';

import { Search, Settings2 } from 'lucide-react';
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
import type { Tenant } from '@/shared/types/tenant.types';

interface AdminCertificatesFilterProps {
  statusFilter: string;
  tenantFilter: string;
  onStatusFilterChange: (value: string) => void;
  onTenantFilterChange: (value: string) => void;
  onSearch: () => void;
  tenants: Tenant[];
  showTenantFilter?: boolean;
}

export function AdminCertificatesFilter({
  statusFilter,
  tenantFilter,
  onStatusFilterChange,
  onTenantFilterChange,
  onSearch,
  tenants,
  showTenantFilter = true,
}: AdminCertificatesFilterProps) {
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
            <Label className="text-xs text-muted-foreground">Statut</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger aria-label="Filtrer par statut" className="w-full">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showTenantFilter && (
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
          )}

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
