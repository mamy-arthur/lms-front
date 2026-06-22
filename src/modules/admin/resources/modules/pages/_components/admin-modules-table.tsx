"use client";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { formatDate } from "@/shared/lib/date";
import type { Module } from "../../types";

export type SortConfig = DataTableSort;

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
  tenantNames,
}: AdminModulesTableProps) {
  const columns: DataTableColumn<Module>[] = [
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
          {mod.createdAt ? formatDate(mod.createdAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
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
      emptyState={{
        title: "Aucun module",
        description: "Aucun module pour le moment.",
      }}
    />
  );
}
