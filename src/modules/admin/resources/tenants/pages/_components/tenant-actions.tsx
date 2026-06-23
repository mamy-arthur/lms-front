"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Ban, Trash2 } from "lucide-react";
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
    // onView,
    onEdit,
    // onImpersonate,
    // onToggleSuspend,
    // onDelete,
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
                <DropdownMenuItem onClick={() => onEdit(tenant)}>
                    <Pencil className="mr-2 size-3.5 text-muted-foreground" />
                    Modifier
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
