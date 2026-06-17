"use client";

import {
  UsersTable,
  type UsersTableColumn,
  type UsersTableSort,
} from "@/shared/components/users";
import type { Module } from "../../types";
import { CategoryCell } from "./category-cell";
import { ModuleActions } from "./module-actions";

export type SortConfig = UsersTableSort;

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
    <UsersTable<Module>
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
      emptyMessages={{
        default:
          "Créez votre premier module en cliquant sur « Ajouter un module ».",
        filtered:
          "Modifiez votre recherche ou vos filtres pour trouver ce que vous cherchez.",
      }}
    />
  );
}
