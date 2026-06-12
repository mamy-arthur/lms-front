"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { UsersTableSort } from "@/shared/components/users";
import { UserFormDrawer } from "../components/UserFormDrawer";
import { useTenantUsersQuery } from "../hooks/useTenantUsersQuery";
import type { TenantUser, TenantUserSearchParams } from "../types";
import { TenantUsersFilters } from "./_components/tenant-users-filters";
import { TenantUsersTable } from "./_components/tenant-users-table";
import { useUsersListController } from "@/modules/shared/hooks/useUsersListController";

export function TenantUsersList() {
  const {
    isDrawerOpen,
    editingUser,
    draftSearch,
    setDraftSearch,
    draftRole,
    setDraftRole,
    draftStatus,
    setDraftStatus,
    params,
    sort,
    handleSearch,
    handleSort,
    handleOpenCreate,
    handleCloseDrawer,
    handleSuccess,
    handleEdit,
    handlePageChange,
    handlePageSizeChange,
    page,
    pageSize,
    hasQuery,
  } = useUsersListController<TenantUser, TenantUserSearchParams>({ defaultPageSize: 12 });

  const { data: queryResult } = useTenantUsersQuery(params);

  return (
    <div className="space-y-6 p-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Utilisateurs</h1>
        <Button onClick={handleOpenCreate} size="lg" className="bg-(--color-primary) text-primary-foreground">
          <Plus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <TenantUsersFilters
        search={draftSearch}
        roleFilter={draftRole}
        statusFilter={draftStatus}
        onSearchChange={setDraftSearch}
        onRoleFilterChange={setDraftRole}
        onStatusFilterChange={setDraftStatus}
        onSearch={handleSearch}
      />

      <TenantUsersTable
        users={queryResult?.data ?? []}
        hasQuery={hasQuery}
        page={page}
        pageSize={pageSize}
        total={queryResult?.total ?? 0}
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
