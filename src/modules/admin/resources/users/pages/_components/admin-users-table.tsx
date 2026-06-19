"use client";

import {
  UsersContentTable,
  type UsersTableSort,
} from "@modules/shared/components/users";
import type { User } from "../../types";

export type SortColumn =
  | "username"
  | "email"
  | "role"
  | "tenantId"
  | "isActive"
  | "city"
  | "country"
  | "lastLogin"
  | "createdAt";
export type SortConfig = UsersTableSort;

interface AdminUsersTableProps {
  users: User[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
  onDelete: (user: User) => void;
  tenantNames: Record<string, string>;
}

export function AdminUsersTable({
  users,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
  tenantNames,
}: AdminUsersTableProps) {
  return (
    <UsersContentTable
      users={users}
      isLoading={isLoading}
      hasQuery={hasQuery}
      page={page}
      pageSize={pageSize}
      total={total}
      sort={sort}
      onSort={onSort}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onView={onView}
      onEdit={onEdit}
      onToggleActive={onToggleActive}
      onDelete={onDelete}
      tenantNames={tenantNames}
      isActiveSortable={true}
      showTimeInLastLogin={true}
    />
  );
}
