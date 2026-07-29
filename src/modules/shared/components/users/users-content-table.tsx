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
import { formatDate } from '@/shared/lib/date';
import type { Role } from '@/shared/constants/roles';

interface UsersContentRow {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  profile_photo?: { id: string; url: string; mime_type: string } | null;
  // champs optionnels pour compatibilité rétroactive
  username?: string;
  address?: string | null;
  zip_code?: string | null;
  city?: string | null;
  country?: string | null;
  biography?: string | null;
  timezone?: string | null;
  preferred_language?: string | null;
  lastLogin?: string;
  createdAt?: string;
  isActive?: boolean;
  tenantId?: string;
  tenant_id?: string | null;
  editor_id?: string | null;
  updated_at?: string | null;
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
  rowTestId,
}: UsersContentTableProps<T>) {
  const columns: UsersTableColumn<T>[] = [
    {
      key: 'name',
      label: 'Utilisateur',
      sortable: true,
      render: (user) => (
        <UserAvatar
          name={`${user.first_name} ${user.last_name}`.trim()}
          first_name={user.first_name}
          last_name={user.last_name}
          photoUrl={user.profile_photo?.url ?? null}
        />
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
      sortable: false,
      render: (user) => <UserRoleBadge role={user.role} />,
    },
    ...(tenantNames
      ? [
          {
            key: 'tenant_id' as const,
            label: 'Tenant' as const,
            sortable: false,
            render: (user: T) => (
              <span className="text-xs text-muted-foreground">
                {tenantNames[user.tenant_id ?? user.tenantId ?? ''] || '—'}
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'is_active',
      label: 'Statut',
      sortable: isActiveSortable,
      render: (user) => <UserActiveBadge isActive={user.is_active ?? user.isActive ?? true} />,
    },
    {
      key: 'created_at',
      label: 'Création',
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(user.created_at || user.createdAt || '')}
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
            isActive={user.is_active ?? user.isActive ?? true}
            userLabel={user.full_name || `${user.first_name} ${user.last_name}`.trim()}
            onView={onView ? () => onView(user) : undefined}
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
