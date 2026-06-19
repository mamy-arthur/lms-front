"use client";

import { Users } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from "@/shared/components/ui/DataTable";

export interface UsersTableColumn<T> extends DataTableColumn<T> {}
export interface UsersTableSort extends DataTableSort {}

interface UsersTableProps<T extends { id: string | number }> {
  data: T[];
  columns: UsersTableColumn<T>[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: UsersTableSort;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessages?: { default: string; filtered: string };
  rowTestId?: string;
}

export function UsersTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  emptyMessages,
  rowTestId,
}: UsersTableProps<T>) {
  return (
    <DataTable
      data={data}
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
      onRowClick={onRowClick}
      rowTestId={rowTestId}
      emptyState={{
        icon: <Users className="size-8 text-muted-foreground" />,
        title: "Aucun utilisateur",
        description:
          emptyMessages?.default ??
          "Créez votre premier utilisateur en cliquant sur « Nouvel utilisateur ».",
        filteredDescription: emptyMessages?.filtered,
      }}
    />
  );
}
