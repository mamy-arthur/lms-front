'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserSearch } from '@modules/shared/components/users';
import { UserFormDrawer } from '../components/UserFormDrawer';
import { useClientUsersQuery } from '../hooks/useClientUsersQuery';
import type { ClientUser, ClientUserSearchParams } from '../types';
import { ClientUsersFilter } from './_components/client-users-filters';
import { ClientUsersTable } from './_components/client-users-table';
import { useUsersListController } from '@/modules/shared/hooks/useUsersListController';

export function ClientUserList() {
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
  } = useUsersListController<ClientUser, ClientUserSearchParams>({ defaultPageSize: 12 });

  const { data: queryResult } = useClientUsersQuery(params);

  return (
    <div className="bg-background">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez, modifiez et gérez vos utilisateurs.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserSearch value={draftSearch} onChange={setDraftSearch} onSearch={handleSearch} />
          <div className="flex items-center gap-2 sm:ml-auto">
            <ClientUsersFilter
              roleFilter={draftRole}
              statusFilter={draftStatus}
              onRoleFilterChange={setDraftRole}
              onStatusFilterChange={setDraftStatus}
              onSearch={handleSearch}
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

        <ClientUsersTable
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
      </div>

      <UserFormDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleSuccess}
        user={editingUser}
      />
    </div>
  );
}
