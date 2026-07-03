'use client';

import {
  UserActions,
  UserActiveBadge,
  UserAvatar,
  UserRoleBadge,
  UsersTable,
  type UsersTableColumn,
  type UsersTableSort,
} from './';
import { formatDate, formatDateWithTime } from '@/shared/lib/date';
import type { Role } from '@/shared/constants/roles';

interface UsersContentRow {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  city: string;
  country: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  tenantId?: string;
}

export interface UsersContentTableProps<T extends UsersContentRow = UsersContentRow> {
  users: T[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: UsersTableSort;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView?: (user: T) => void;
  onEdit?: (user: T) => void;
  onToggleActive?: (user: T) => void;
  onDelete?: (user: T) => void;
  tenantNames?: Record<string, string>;
  isActiveSortable?: boolean;
  showTimeInLastLogin?: boolean;
  rowTestId?: string;
}

export function UsersContentTable<T extends UsersContentRow = UsersContentRow>({
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
  isActiveSortable = true,
  showTimeInLastLogin = false,
  rowTestId,
}: UsersContentTableProps<T>) {
  const columns: UsersTableColumn<T>[] = [
    {
      key: 'username',
      label: 'Utilisateur',
      sortable: true,
      render: (user) => (
        <UserAvatar name={user.username} first_name={user.first_name} last_name={user.last_name} />
      ),
      skeleton: (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="h-3 w-28 bg-muted animate-pulse rounded" />
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user) => <span className="text-xs text-muted-foreground">{user.email}</span>,
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      render: (user) => <UserRoleBadge role={user.role} />,
    },
    ...(tenantNames
      ? [
          {
            key: 'tenantId' as const,
            label: 'Tenant' as const,
            sortable: true,
            render: (user: T) => (
              <span className="text-xs text-muted-foreground">
                {tenantNames[user.tenantId ?? ''] || user.tenantId || '—'}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'city',
      label: 'Ville',
      sortable: true,
      render: (user) => <span className="text-xs text-muted-foreground">{user.city || '—'}</span>,
    },
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground">{user.country || '—'}</span>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Dernière connexion',
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {showTimeInLastLogin ? formatDateWithTime(user.lastLogin) : formatDate(user.lastLogin)}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Statut',
      sortable: isActiveSortable,
      render: (user) => <UserActiveBadge isActive={user.isActive} />,
    },
    {
      key: 'createdAt',
      label: 'Création',
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (user) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <UserActions
            isActive={user.isActive}
            userLabel={user.username}
            onView={() => onView?.(user)}
            onEdit={() => onEdit?.(user)}
            onToggleActive={() => onToggleActive?.(user)}
            onDelete={() => onDelete?.(user)}
          />
        </div>
      ),
    },
  ];

  return (
    <UsersTable
      data={users}
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
      onRowClick={onView}
      rowTestId={rowTestId}
    />
  );
}
