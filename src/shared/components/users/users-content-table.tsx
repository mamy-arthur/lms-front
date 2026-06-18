"use client";

import { Role } from "@/shared/constants/roles";
import {
  UserActiveBadge,
  UserActions,
  UserAvatar,
  UserRoleBadge,
  UsersTable,
  type UsersTableColumn,
  type UsersTableSort,
} from "@/shared/components/users";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateWithTime(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface UserRow {
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

export interface UsersContentTableProps<T extends { id: string | number }> {
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

export function UsersContentTable<T extends { id: string | number }>({
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
      key: "username",
      label: "Utilisateur",
      sortable: true,
      render: (user) => (
        <UserAvatar
          name={(user as unknown as UserRow).username}
          first_name={(user as unknown as UserRow).first_name}
          last_name={(user as unknown as UserRow).last_name}
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
      key: "email",
      label: "Email",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground">
          {(user as unknown as UserRow).email}
        </span>
      ),
    },
    {
      key: "role",
      label: "Rôle",
      sortable: true,
      render: (user) => (
        <UserRoleBadge role={(user as unknown as UserRow).role} />
      ),
    },
    ...(tenantNames
      ? [
          {
            key: "tenantId",
            label: "Tenant" as const,
            sortable: true,
            render: (user: T) => {
              const u = user as unknown as UserRow;
              return (
                <span className="text-xs text-muted-foreground">
                  {tenantNames[u.tenantId ?? ""] || u.tenantId || "—"}
                </span>
              );
            },
          },
        ]
      : []),
    {
      key: "city",
      label: "Ville",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground">
          {(user as unknown as UserRow).city || "—"}
        </span>
      ),
    },
    {
      key: "country",
      label: "Pays",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground">
          {(user as unknown as UserRow).country || "—"}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: "Dernière connexion",
      sortable: true,
      render: (user) => {
        const lastLogin = (user as unknown as UserRow).lastLogin;
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {showTimeInLastLogin
              ? formatDateWithTime(lastLogin)
              : formatDate(lastLogin)}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: "Statut",
      sortable: isActiveSortable,
      render: (user) => (
        <UserActiveBadge
          isActive={(user as unknown as UserRow).isActive}
        />
      ),
    },
    {
      key: "createdAt",
      label: "Création",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate((user as unknown as UserRow).createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (user) => {
        const u = user as unknown as UserRow;
        return (
          <div className="text-right" onClick={(e) => e.stopPropagation()}>
            <UserActions
              isActive={u.isActive}
              userLabel={u.username}
              onView={() => onView?.(user)}
              onEdit={() => onEdit?.(user)}
              onToggleActive={() => onToggleActive?.(user)}
              onDelete={() => onDelete?.(user)}
            />
          </div>
        );
      },
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
