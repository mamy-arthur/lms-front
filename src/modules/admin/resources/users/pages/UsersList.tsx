'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserSearch, UsersFilter } from '@modules/shared/components/users';
import { AdminUserFormDrawer } from './_components/admin-user-form-drawer';
import { AdminUsersTable } from './_components/admin-users-table';
import { useUsersQuery } from '../hooks/useUsersQuery';
import type { User, UserSearchParams } from '../types';
import { useUsersListController } from '@/modules/shared/hooks/useUsersListController';
import { Role } from '@/shared/constants/roles';
import { useToggleUserActive } from '../hooks/useToggleUserActive';
import { useDeleteUser } from '../hooks/useDeleteUser';
import { useResetUserTwoFactor } from '../hooks/useResetUserTwoFactor';
import { useDeleteConfirm } from '@/modules/shared/hooks/useDeleteConfirm';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ConfirmDialog } from '@/shared/components/confirm-dialog/ConfirmDialog';

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
    handleSearchOnly,
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

  const activeTenant = useTenantStore((s) => s.tenant);
  const scopedParams = useMemo(
    () => ({ ...params, ...(activeTenant ? { tenant_id: activeTenant.id } : {}) }),
    [params, activeTenant],
  );

  const { data, isLoading } = useUsersQuery(scopedParams);
  const toggleActive = useToggleUserActive();
  const deleteUser = useDeleteUser();
  const { openConfirm: confirmDelete, dialog: deleteDialog } = useDeleteConfirm((id) =>
    deleteUser.mutate(id),
  );

  const isSuperAdmin = useAuthStore((s) => s.role) === Role.SUPER_ADMIN;
  const resetTwoFactor = useResetUserTwoFactor();
  const [twoFactorTarget, setTwoFactorTarget] = useState<User | null>(null);

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
          <UserSearch value={draftSearch} onChange={setDraftSearch} onSearch={handleSearchOnly} />
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
          onDelete={(user) => confirmDelete(user)}
          onResetTwoFactor={isSuperAdmin ? (user) => setTwoFactorTarget(user) : undefined}
        />
      </div>

      <AdminUserFormDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleSuccess}
        user={editingUser}
      />

      {deleteDialog}

      <ConfirmDialog
        open={twoFactorTarget !== null}
        title="Réinitialiser la double authentification"
        description={
          twoFactorTarget
            ? `Cette action révoque tous les appareils de confiance de ${twoFactorTarget.full_name} et invalide son code en cours. Un nouveau code lui sera demandé à la prochaine connexion.`
            : undefined
        }
        confirmLabel="Réinitialiser"
        onClose={() => setTwoFactorTarget(null)}
        onConfirm={() => {
          if (twoFactorTarget) {
            resetTwoFactor.mutate(twoFactorTarget.id);
            setTwoFactorTarget(null);
          }
        }}
      />
    </div>
  );
}
