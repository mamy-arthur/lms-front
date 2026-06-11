"use client";

import { useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { TenantUser } from "../../types";
import { UserAvatar } from "./user-avatar";
import { UserRoleBadge } from "./user-role-badge";
import { UserActiveBadge } from "./user-active-badge";
import { UserActions } from "./user-actions";

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Users className="size-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {hasQuery ? "Aucun résultat" : "Aucun utilisateur"}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {hasQuery
          ? "Modifiez votre recherche ou vos filtres pour trouver ce que vous cherchez."
          : "Créez votre premier utilisateur en cliquant sur « Nouvel utilisateur »."}
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-3 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-3 w-20" /></TableCell>
      <TableCell />
    </TableRow>
  );
}

interface TenantUsersTableProps {
  users: TenantUser[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onView: (user: TenantUser) => void;
  onEdit: (user: TenantUser) => void;
  onToggleActive: (user: TenantUser) => void;
  onDelete: (user: TenantUser) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function TenantUsersTable({
  users,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onToggleActive,
  onDelete,
}: TenantUsersTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const formatDate = (dateStr: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const buildPages = useCallback(() => {
    const pages: (number | "ellipsis")[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 2) pages.push("ellipsis");
      const start = Math.max(1, page - 1);
      const end = Math.min(pageCount - 2, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < pageCount - 3) pages.push("ellipsis");
      pages.push(pageCount - 1);
    }
    return pages;
  }, [page, pageCount]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-70 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Utilisateur
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rôle
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Statut
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Création
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="p-0">
                <EmptyState hasQuery={hasQuery} />
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                data-testid="user-row"
                className="group cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => onView(user)}
              >
                <TableCell>
                  <UserAvatar user={user} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <UserRoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <UserActiveBadge isActive={user.isActive} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <UserActions
                    user={user}
                    onView={onView}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Lignes par page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-transparent px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} sur {total}
            </span>
          </div>

          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Précédent"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (page > 0) onPageChange(page - 1);
                  }}
                />
              </PaginationItem>

              {buildPages().map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onPageChange(p);
                      }}
                    >
                      {p + 1}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Suivant"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (page < pageCount - 1) onPageChange(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
