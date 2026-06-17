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
     <div className="bg-background">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <h1 className="text-2xl font-bold tracking-tight">
                  Utilisateurs
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                  Gérez vos utilisateurs ici.
              </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
              <Button
                  onClick={handleOpenCreate}
                  className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground"
              >
                  <Plus className="mr-1 size-4" />
                   Nouvel utilisateur
              </Button>
          </div>
      </header>

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
