'use client';

import { UsersContentTable, type UsersTableSort } from '@modules/shared/components/users';
import type { ClientUser } from '../../types';

export type SortColumn =
  'username' | 'email' | 'role' | 'city' | 'country' | 'lastLogin' | 'createdAt';
export type SortConfig = UsersTableSort;

interface ClientUsersTableProps {
  users: ClientUser[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortConfig;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (user: ClientUser) => void;
  onEdit: (user: ClientUser) => void;
  onToggleActive: (user: ClientUser) => void;
  onDelete: (user: ClientUser) => void;
}

export function ClientUsersTable({
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
}: ClientUsersTableProps) {
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
      isActiveSortable={false}
      showTimeInLastLogin={false}
      rowTestId="user-row"
    />
  );
}
