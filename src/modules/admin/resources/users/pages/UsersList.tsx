"use client";

import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { UsersTableSort } from "@/shared/components/users";
import { useAllTenantsQuery } from "../hooks/useAllTenantsQuery";
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
    <div className="space-y-6 p-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold">Utilisateurs</h1>
        <Button onClick={handleOpenCreate} size="lg" className="bg-(--color-primary) text-primary-foreground">
          <Plus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

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
