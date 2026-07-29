'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';
import { UserSearch, UsersFilter } from '@modules/shared/components/users';
import { AdminUserFormDrawer } from './_components/admin-user-form-drawer';
import { AdminUsersTable } from './_components/admin-users-table';
import { useUsersQuery } from '../hooks/useUsersQuery';
import type { User, UserSearchParams } from '../types';
import { useUsersListController } from '@/modules/shared/hooks/useUsersListController';
import { Role } from '@/shared/constants/roles';
import { useToggleUserActive } from '../hooks/useToggleUserActive';
import { useDeleteUser } from '../hooks/useDeleteUser';

const ROLE_OPTIONS = [
  { value: Role.SUPER_ADMIN, label: 'Super admin' },
  { value: Role.EDITOR, label: 'Éditeur' },
  { value: Role.CLIENT_MANAGER, label: 'Responsable' },
  { value: Role.TRAINEE, label: 'Stagiaire' },
] as const;

export function UsersList() {
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
  } = useUsersListController<User, UserSearchParams>({ defaultPageSize: 25 });

  const { data, isLoading } = useUsersQuery(params);
  const toggleActive = useToggleUserActive();
  const deleteUser = useDeleteUser();
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  return (
    <div className="bg-background">
      <header className="mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez, modifiez et gérez les utilisateurs.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserSearch value={draftSearch} onChange={setDraftSearch} onSearch={handleSearch} />
          <div className="flex items-center gap-2 sm:ml-auto">
            <UsersFilter
              roleFilter={draftRole}
              statusFilter={draftStatus}
              onRoleFilterChange={setDraftRole}
              onStatusFilterChange={setDraftStatus}
              onSearch={handleSearch}
              roleOptions={ROLE_OPTIONS}
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
          onEdit={handleEdit}
          onToggleActive={(user) =>
            toggleActive.mutate({ id: user.id, is_active: !user.is_active })
          }
          onDelete={(user) => setDeletingUser(user)}
        />
      </div>

      <AdminUserFormDrawer
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
          if (deletingUser) deleteUser.mutate(deletingUser.id);
        }}
      />
    </div>
  );
}
