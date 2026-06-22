"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";
import { Tenant } from "@/shared/types/tenants/tenant";
import { TenantAvatar } from "../_components/tenant-avatar";
import { TenantStatusBadge } from "../_components/tenant-status-badge";
import { TenantActions } from "../_components/tenant-actions";

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Building2 className="size-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {hasQuery ? "Aucun résultat" : "Aucun tenant"}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {hasQuery
          ? "Modifiez votre recherche ou vos filtres pour trouver ce que vous cherchez."
          : "Créez votre premier tenant en cliquant sur « Nouveau tenant »."}
      </p>
    </div>
  );
}

// ─── Skeleton Row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-3 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell />
    </TableRow>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TenantsTableProps {
  tenants: Tenant[];
  isLoading?: boolean;
  hasQuery?: boolean;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onImpersonate: (tenant: Tenant) => void;
  onToggleSuspend: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TenantsTable({
  tenants,
  isLoading = false,
  hasQuery = false,
  onView,
  onEdit,
  onImpersonate,
  onToggleSuspend,
  onDelete,
}: TenantsTableProps) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-70 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tenant
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Statut
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Création
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : tenants.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="p-0">
                <EmptyState hasQuery={hasQuery} />
              </TableCell>
            </TableRow>
          ) : (
            tenants.map((tenant) => (
              <TableRow
                key={tenant.id}
                className="group cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => onView(tenant)}
              >
                <TableCell>
                  <TenantAvatar tenant={tenant} />
                </TableCell>
                <TableCell>
                  <TenantStatusBadge status={tenant.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(tenant.created_at)}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TenantActions
                    tenant={tenant}
                    onView={onView}
                    onEdit={onEdit}
                    onImpersonate={onImpersonate}
                    onToggleSuspend={onToggleSuspend}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}