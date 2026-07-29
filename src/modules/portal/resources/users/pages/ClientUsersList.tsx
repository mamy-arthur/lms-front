'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';
import { UserSearch } from '@modules/shared/components/users';
import { UserFormDrawer } from '../components/UserFormDrawer';
import { useClientUsersQuery } from '../hooks/useClientUsersQuery';
import type { ClientUser, ClientUserSearchParams } from '../types';
import { ClientUsersFilter } from './_components/client-users-filters';
import { ClientUsersTable } from './_components/client-users-table';
import { useUsersListController } from '@/modules/shared/hooks/useUsersListController';
import { useToggleClientUserActive } from '../hooks/useToggleClientUserActive';
import { useDeleteClientUser } from '../hooks/useDeleteClientUser';

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
  const toggleActive = useToggleClientUserActive();
  const deleteClientUser = useDeleteClientUser();
  const [deletingUser, setDeletingUser] = useState<ClientUser | null>(null);

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
          onEdit={handleEdit}
          onToggleActive={(user) =>
            toggleActive.mutate({ id: user.id, is_active: !user.is_active })
          }
          onDelete={(user) => setDeletingUser(user)}
        />
      </div>

      <UserFormDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleSuccess}
        user={editingUser}
      />

      <ConfirmDialog
        open={deletingUser !== null}
        title="Supprimer l'utilisateur"
        description={
          deletingUser
            ? `Êtes-vous sûr de vouloir supprimer « ${deletingUser.full_name || `${deletingUser.first_name} ${deletingUser.last_name}`.trim()} » ? Cette action est irréversible.`
            : undefined
        }
        confirmLabel="Supprimer"
        confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClose={() => setDeletingUser(null)}
        onConfirm={() => {
          if (deletingUser) deleteClientUser.mutate(deletingUser.id);
        }}
      />
    </div>
  );
}
