"use client";

import {
  UsersTable,
  type UsersTableColumn,
  type UsersTableSort,
  UserAvatar,
  UserRoleBadge,
  UserActiveBadge,
} from "@/shared/components/users";
import type { User } from "../../types";
import { UserActions } from "./user-actions";

export type SortColumn = "username" | "email" | "role" | "tenantId" | "isActive" | "city" | "country" | "lastLogin" | "createdAt";
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
  const formatDate = (dateStr: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const columns: UsersTableColumn<User>[] = [
    {
      key: "username",
      label: "Utilisateur",
      sortable: true,
      render: (user) => (
        <UserAvatar
          name={user.username}
          first_name={user.first_name}
          last_name={user.last_name}
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
        <span className="text-xs text-muted-foreground">{user.email}</span>
      ),
    },
    {
      key: "role",
      label: "Rôle",
      sortable: true,
      render: (user) => <UserRoleBadge role={user.role} />,
    },
    {
      key: "tenantId",
      label: "Tenant",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground">
          {tenantNames[user.tenantId] || user.tenantId || "—"}
        </span>
      ),
    },
    {
      key: "city",
      label: "Ville",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground">{user.city || "—"}</span>
      ),
    },
    {
      key: "country",
      label: "Pays",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground">{user.country || "—"}</span>
      ),
    },
    {
      key: "lastLogin",
      label: "Dernière connexion",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Statut",
      sortable: true,
      render: (user) => <UserActiveBadge isActive={user.isActive} />,
    },
    {
      key: "createdAt",
      label: "Création",
      sortable: true,
      render: (user) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      render: (user) => (
        <div className="text-right" onClick={(e) => e.stopPropagation()}>
          <UserActions
            isActive={user.isActive}
            userLabel={user.username}
            onView={() => onView(user)}
            onEdit={() => onEdit(user)}
            onToggleActive={() => onToggleActive(user)}
            onDelete={() => onDelete(user)}
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
    />
  );
}
