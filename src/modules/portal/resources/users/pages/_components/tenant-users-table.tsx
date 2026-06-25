"use client";

import {
  UsersContentTable,
  type UsersTableSort,
} from "@modules/shared/components/users";
import type { TenantUser } from "../../types";

export type SortColumn =
  | "username"
  | "email"
  | "role"
  | "city"
  | "country"
  | "lastLogin"
  | "createdAt";
export type SortConfig = UsersTableSort;

interface TenantUsersTableProps {
  users: TenantUser[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function TenantUsersTable({
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
}: TenantUsersTableProps) {
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
      onView={() => {}}
      onEdit={() => {}}
      onToggleActive={() => {}}
      onDelete={() => {}}
      isActiveSortable={false}
      showTimeInLastLogin={false}
      rowTestId="user-row"
    />
  );
}
