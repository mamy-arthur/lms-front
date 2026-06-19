"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserSearch } from "@modules/shared/components/users";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { AdminUserFormDrawer } from "./_components/admin-user-form-drawer";
import { AdminUsersFilter } from "./_components/admin-users-filters";
import { AdminUsersTable } from "./_components/admin-users-table";
import { useUsersQuery } from "../hooks/useUsersQuery";
import type { User, UserSearchParams } from "../types";
import { useUsersListController } from "@/modules/shared/hooks/useUsersListController";

export function UsersList() {
  const { isDrawerOpen,
    editingUser,
    draftSearch,
    setDraftSearch,
    draftRole,
    setDraftRole,
    draftStatus,
    setDraftStatus,
    draftTenant,
    setDraftTenant,
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
  } = useUsersListController<User, UserSearchParams>({ includeTenantFilter: true, defaultPageSize: 25 });

  const { data: tenantsData } = useAllTenantsQuery();
  const tenants = tenantsData?.data ?? [];

  const tenantNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of tenants) {
      map[t.id] = t.name;
    }
    return map;
  }, [tenants]);

  const { data, isLoading } = useUsersQuery(params);

  return (
    
    <div className="bg-background">
      <header className="mb-8">
          <div>
              <h1 className="text-2xl font-bold tracking-tight">
                  Utilisateurs
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                  Ajoutez, modifiez et gérez les utilisateurs.
              </p>
          </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserSearch
            value={draftSearch}
            onChange={setDraftSearch}
            onSearch={handleSearch}
          />
          <div className="flex items-center gap-2 sm:ml-auto">
            <AdminUsersFilter
              roleFilter={draftRole}
              statusFilter={draftStatus}
              tenantFilter={draftTenant}
              onRoleFilterChange={setDraftRole}
              onStatusFilterChange={setDraftStatus}
              onTenantFilterChange={setDraftTenant}
              onSearch={handleSearch}
              tenants={tenants}
            />
            <Button
              onClick={handleOpenCreate}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
            >
              <Plus className="size-4" />
              Nouveau
            </Button>
          </div>
        </div>

        <AdminUsersTable
          users={data?.data ?? []}
          isLoading={isLoading}
          hasQuery={hasQuery}
          page={page}
          pageSize={pageSize}
          total={data?.total ?? 0}
          sort={sort}
          onSort={handleSort}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onView={() => {}}
          onEdit={handleEdit}
          onToggleActive={() => {}}
          onDelete={() => {}}
          tenantNames={tenantNames}
        />
      </div>

      <AdminUserFormDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleSuccess}
        user={editingUser}
        tenants={tenants}
      />
    </div>
  );
}
