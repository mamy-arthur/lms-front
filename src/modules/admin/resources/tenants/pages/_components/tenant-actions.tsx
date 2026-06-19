"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  LogIn,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Tenant } from "@/shared/types/tenants/tenant";

interface TenantActionsProps {
  tenant: Tenant;
  onView: (tenant: Tenant) => void;
  onEdit: (tenant: Tenant) => void;
  onImpersonate: (tenant: Tenant) => void;
  onToggleSuspend: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}

export function TenantActions({
  tenant,
  onView,
  onEdit,
  onImpersonate,
  onToggleSuspend,
  onDelete,
}: TenantActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
          aria-label={`Actions pour ${tenant.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(tenant)}>
          <Eye className="mr-2 size-3.5 text-muted-foreground" />
          Voir le détail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(tenant)}>
          <Pencil className="mr-2 size-3.5 text-muted-foreground" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onImpersonate(tenant)}>
          <LogIn className="mr-2 size-3.5 text-muted-foreground" />
          Impersonner
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onToggleSuspend(tenant)}
          className={
            tenant.status === "suspended"
              ? "text-emerald-600 focus:text-emerald-600"
              : "text-amber-600 focus:text-amber-600"
          }
        >
          {tenant.status === "suspended" ? (
            <CheckCircle className="mr-2 size-3.5" />
          ) : (
            <Ban className="mr-2 size-3.5" />
          )}
          {tenant.status === "suspended" ? "Réactiver" : "Suspendre"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(tenant)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-3.5" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}