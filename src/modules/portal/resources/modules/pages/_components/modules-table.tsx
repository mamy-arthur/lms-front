"use client";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import type { Module } from "../../types";

export type SortConfig = DataTableSort;

interface ModulesTableProps {
  modules: Module[];
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function ModulesTable({
  modules,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
}: ModulesTableProps) {
  const columns: DataTableColumn<Module>[] = [
    {
      key: "name",
      label: "Module",
      sortable: true,
      render: (module) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {module.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {module.identifier}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      label: "Catégorie",
      sortable: true,
      render: (module) => (
        <span className="text-xs text-muted-foreground">
          {module.category || "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={modules}
      columns={columns}
      hasQuery={hasQuery}
      page={page}
      pageSize={pageSize}
      total={total}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      rowTestId="module-row"
      emptyState={{
        title: "Aucun module",
        description: "Aucun module pour le moment.",
      }}
    />
  );
}
