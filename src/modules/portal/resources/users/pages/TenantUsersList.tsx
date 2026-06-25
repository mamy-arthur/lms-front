"use client";

import { UserSearch } from "@modules/shared/components/users";
import { useTenantUsersQuery } from "../hooks/useTenantUsersQuery";
import type { TenantUser, TenantUserSearchParams } from "../types";
import { TenantUsersFilter } from "./_components/tenant-users-filters";
import { TenantUsersTable } from "./_components/tenant-users-table";
import { useUsersListController } from "@/modules/shared/hooks/useUsersListController";

export function TenantUsersList() {
  const {
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
    handlePageChange,
    handlePageSizeChange,
    page,
    pageSize,
    hasQuery,
  } = useUsersListController<TenantUser, TenantUserSearchParams>({ defaultPageSize: 12 });

  const { data: queryResult } = useTenantUsersQuery(params);

  return (
     <div className="bg-background">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <h1 className="text-2xl font-bold tracking-tight">
                  Utilisateurs
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                  Consultez les utilisateurs de votre organisation.
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
            <TenantUsersFilter
              roleFilter={draftRole}
              statusFilter={draftStatus}
              onRoleFilterChange={setDraftRole}
              onStatusFilterChange={setDraftStatus}
              onSearch={handleSearch}
            />
          </div>
        </div>

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
        />
      </div>
    </div>
  );
}
