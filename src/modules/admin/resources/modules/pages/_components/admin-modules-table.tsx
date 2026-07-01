"use client";

import {
    DataTable,
    type DataTableColumn,
    type DataTableSort,
} from "@/shared/components/ui/DataTable";
import { formatDate } from "@/shared/lib/date";
import type { Module } from "../../types";
import { CategoryCell } from "./category-cell";
import { ModuleActions } from "../../components/module-actions";

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
    onEdit?: (module: Module) => void;
    onDuplicate?: (module: Module) => void;
    onDelete?: (module: Module) => void;
    onCategoryChange?: (moduleId: string, newCategory: string) => void;
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
    onDuplicate,
    onDelete,
    onCategoryChange,
}: AdminModulesTableProps) {
    const columns: DataTableColumn<Module>[] = [
        {
            key: "identifier",
            label: "Référence",
            sortable: true,
            render: (mod) => (
                <div className="flex flex-col">
                    <span className="text-xs font-medium">
                        {mod.identifier}
                    </span>
                </div>
            ),
        },
        {
            key: "name",
            label: "Module",
            sortable: true,
            render: (mod) => (
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                        {mod.name}
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
            key: "createdAt",
            label: "Création",
            sortable: true,
            render: (mod) => (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {mod.createdAt ? formatDate(mod.createdAt) : "—"}
                </span>
            ),
        },
        {
            key: "actions",
            label: "",
            sortable: false,
            render: (mod) => (
                <div
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ModuleActions
                        moduleLabel={mod.name}
                        onEdit={() => onEdit?.(mod)}
                        onDuplicate={() => onDuplicate?.(mod)}
                        onDelete={() => onDelete?.(mod)}
                    />
                </div>
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
