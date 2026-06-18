"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { UsersTableSort } from "@modules/shared/components/users";
import { useAllTenantsQuery } from "@/modules/shared/hooks/useAllTenantsQuery";
import { AdminUserFormDrawer } from "./_components/admin-user-form-drawer";
import { AdminUsersFilters } from "./_components/admin-users-filters";
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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <h1 className="text-2xl font-bold tracking-tight">
                  Utilisateurs
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                  Ajoutez, modifiez et gérez les utilisateurs.
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

      <AdminUsersFilters
        search={draftSearch}
        roleFilter={draftRole}
        statusFilter={draftStatus}
        tenantFilter={draftTenant}
        onSearchChange={setDraftSearch}
        onRoleFilterChange={setDraftRole}
        onStatusFilterChange={setDraftStatus}
        onTenantFilterChange={setDraftTenant}
        onSearch={handleSearch}
        tenants={tenants}
      />

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
