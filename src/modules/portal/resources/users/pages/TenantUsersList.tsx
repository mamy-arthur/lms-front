"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserFormDrawer } from "../components/UserFormDrawer";
import { useTenantUsersQuery } from "../hooks/useTenantUsersQuery";
import type { TenantUser } from "../types";
import { TenantUsersFilters } from "./_components/tenant-users-filters";
import { TenantUsersTable } from "./_components/tenant-users-table";

type SortColumn =
  | "name"
  | "email"
  | "role"
  | "city"
  | "country"
  | "lastLogin"
  | "createdAt";

interface SortConfig {
  column: SortColumn;
  direction: "asc" | "desc";
}

export function TenantUsersList() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortConfig>({
    column: "name",
    direction: "asc",
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  const { data: allUsers = [] } = useTenantUsersQuery();

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
        if (
          !fullName.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)
        )
          return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && statusFilter === "active" && !u.isActive)
        return false;
      if (statusFilter !== "all" && statusFilter === "inactive" && u.isActive)
        return false;
      return true;
    });
  }, [allUsers, search, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sort.column) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "role":
          cmp = a.role.localeCompare(b.role);
          break;
        case "city":
          cmp = a.city.localeCompare(b.city);
          break;
        case "country":
          cmp = a.country.localeCompare(b.country);
          break;
        case "lastLogin":
          cmp =
            new Date(a.lastLogin || 0).getTime() -
            new Date(b.lastLogin || 0).getTime();
          break;
        case "createdAt":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sort.direction === "desc" ? -cmp : cmp;
    });
    return sorted;
  }, [filteredUsers, sort]);

  const total = sortedUsers.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paginatedUsers = useMemo(
    () => sortedUsers.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sortedUsers, safePage, pageSize],
  );

  const handleSort = useCallback((column: SortColumn) => {
    setSort((prev) => ({
      column,
      direction:
        prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingUser(undefined);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingUser(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingUser(undefined);
  }, []);

  const handleEdit = useCallback((user: TenantUser) => {
    setEditingUser(user);
    setIsDrawerOpen(true);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => setPage(newPage),
    [],
  );
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Utilisateurs</h1>
        <Button
          onClick={handleOpenCreate}
          size="lg"
          className="bg-(--color-primary) text-primary-foreground"
        >
          <Plus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <TenantUsersFilters
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
        onSearch={() => {}}
      />

      <TenantUsersTable
        users={paginatedUsers}
        hasQuery={!!search || roleFilter !== "all" || statusFilter !== "all"}
        page={safePage}
        pageSize={pageSize}
        total={total}
        sort={sort}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onView={() => {}}
        onEdit={handleEdit}
        onToggleActive={() => {}}
        onDelete={() => {}}
      />

      <UserFormDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleSuccess}
        user={editingUser}
      />
    </div>
  );
}
