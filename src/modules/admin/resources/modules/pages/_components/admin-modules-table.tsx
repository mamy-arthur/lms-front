"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  UsersTable,
  type UsersTableColumn,
  type UsersTableSort,
} from "@/shared/components/users";
import type { Module } from "../../types";

export type SortConfig = UsersTableSort;

interface AdminModulesTableProps {
  modules: Module[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (mod: Module) => void;
  onDelete?: (mod: Module) => void;
  tenantNames: Record<string, string>;
}

export function AdminModulesTable({
  modules,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  tenantNames,
}: AdminModulesTableProps) {
  const handleDelete = onDelete ?? (() => {});
  const columns: UsersTableColumn<Module>[] = [
    {
      key: "name",
      label: "Module",
      sortable: true,
      render: (mod) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {mod.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {mod.identifier}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      label: "Catégorie",
      sortable: true,
      render: (mod) => (
        <span className="text-xs text-muted-foreground">
          {mod.category || "—"}
        </span>
      ),
    },
    {
      key: "tenantId",
      label: "Tenant",
      sortable: true,
      render: (mod) => (
        <span className="text-xs text-muted-foreground">
          {tenantNames[mod.tenantId] || mod.tenantId || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Création",
      sortable: true,
      render: (mod) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {mod.createdAt
            ? new Date(mod.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (mod) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(mod)}
            aria-label={`Modifier ${mod.name}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => handleDelete(mod)}
            aria-label={`Supprimer ${mod.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <UsersTable<Module>
      data={modules}
      columns={columns}
      isLoading={isLoading}
      hasQuery={hasQuery}
      page={page}
      pageSize={pageSize}
      total={total}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      rowTestId="admin-module-row"
      emptyMessages={{
        default:
          "Aucun module pour le moment.",
        filtered:
          "Modifiez votre recherche ou vos filtres pour trouver ce que vous cherchez.",
      }}
    />
  );
}
