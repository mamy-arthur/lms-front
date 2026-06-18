"use client";

import { ModuleActions } from "@/shared/components/modules";
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
  const columns: UsersTableColumn<Module>[] = [
    {
      key: "name",
      label: "Module",
      sortable: true,
      render: (mod) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
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
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <ModuleActions
            moduleLabel={mod.name}
            onEdit={() => onEdit(mod)}
            onDelete={onDelete ? () => onDelete(mod) : undefined}
          />
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
        default: "Aucun module pour le moment.",
        filtered:
          "Modifiez votre recherche ou vos filtres pour trouver ce que vous cherchez.",
      }}
    />
  );
}
