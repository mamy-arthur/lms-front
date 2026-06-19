"use client";

import { ModuleActions } from "@/shared/components/modules";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";
import type { Module } from "../../types";
import { CategoryCell } from "./category-cell";

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
  onEdit: (mod: Module) => void;
  onDelete?: (mod: Module) => void;
  onCategoryChange?: (moduleId: string, newCategory: string) => void;
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
  onEdit,
  onDelete,
  onCategoryChange,
}: ModulesTableProps) {
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
        <CategoryCell
          module={mod}
          onCategoryChange={(id, cat) => onCategoryChange?.(id, cat)}
        />
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
        description:
          "Créez votre premier module en cliquant sur « Ajouter un module ».",
      }}
    />
  );
}
