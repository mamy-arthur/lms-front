'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserSearch } from '@modules/shared/components/users';
import { AdminUserFormDrawer } from './_components/admin-user-form-drawer';
import { AdminUsersTable } from './_components/admin-users-table';
import { useUsersQuery } from '../hooks/useUsersQuery';
import type { User, UserSearchParams } from '../types';
import { useUsersListController } from '@/modules/shared/hooks/useUsersListController';
import { useClientsQuery } from '@/modules/admin/resources/clients';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
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

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
] as const;

export function UsersList() {
  const {
    isDrawerOpen,
    editingUser,
    draftSearch,
    setDraftSearch,
    selectedRoles,
    draftStatus,
    params,
    sort,
    handleSearch,
    handleSort,
    handleRoleToggle,
    handleStatusFilter,
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
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);

  // Un CLIENT_MANAGER n'a qu'un client : le backend le force deja, afficher le
  // filtre n'aurait aucun sens pour lui.
  const callerRole = useAuthStore((s) => s.role);
  const canFilterByClient = callerRole !== Role.CLIENT_MANAGER;

  // Sur le domaine central aucun tenant n'est resolu : seul un compte global
  // peut en designer un, les autres restent cloisonnes par le backend.
  const canSelectTenant = callerRole === Role.SUPER_ADMIN && !activeTenant;
  const { data: tenantsData } = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => tenantApi.getAll(),
    enabled: canSelectTenant,
  });
  const tenants = tenantsData?.data ?? [];

  const tenantId = activeTenant?.id ?? tenantFilter;
  const { data: clients } = useClientsQuery(
    canFilterByClient && (!canSelectTenant || tenantId !== null),
    tenantId,
  );

  // Changer de tenant invalide le client retenu, qui appartient au precedent.
  const handleTenantFilter = (id: string | null) => {
    setTenantFilter(id);
    setClientFilter(null);
    handlePageChange(0);
  };

  const handleClientFilter = (id: string | null) => {
    setClientFilter(id);
    handlePageChange(0);
  };

  const scopedParams = useMemo(
    () => ({
      ...params,
      ...(tenantId ? { tenant_id: tenantId } : {}),
      ...(clientFilter ? { client_id: clientFilter } : {}),
    }),
    [params, tenantId, clientFilter],
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

  const selectedRoleLabels = ROLE_OPTIONS.filter((o) => selectedRoles.includes(o.value));
  const selectedStatusLabel = STATUS_OPTIONS.find((o) => o.value === draftStatus)?.label;

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
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            {/* Role filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between text-xs font-normal">
                  {selectedRoles.length === 0
                    ? 'Tous les rôles'
                    : `${selectedRoles.length} rôle${selectedRoles.length > 1 ? 's' : ''}`}
                  <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="end">
                <div className="space-y-0.5">
                  {ROLE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                    >
                      <Checkbox
                        checked={selectedRoles.includes(opt.value)}
                        onCheckedChange={() => handleRoleToggle(opt.value)}
                        className="data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {selectedRoles.length > 0 && (
                  <button
                    className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => selectedRoles.forEach((r) => handleRoleToggle(r))}
                  >
                    Effacer
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* Status filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between text-xs font-normal">
                  {draftStatus === 'all' ? 'Tous les statuts' : selectedStatusLabel}
                  <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2" align="end">
                <div className="space-y-0.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                    >
                      <Checkbox
                        checked={draftStatus === opt.value}
                        onCheckedChange={() =>
                          handleStatusFilter(draftStatus === opt.value ? 'all' : opt.value)
                        }
                        className="data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {draftStatus !== 'all' && (
                  <button
                    className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => handleStatusFilter('all')}
                  >
                    Effacer
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* Tenant filter */}
            {canSelectTenant && tenants.length > 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between text-xs font-normal">
                    {tenantFilter
                      ? (tenants.find((t) => String(t.id) === tenantFilter)?.name ?? 'Tenant')
                      : 'Tous les tenants'}
                    <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="max-h-64 space-y-0.5 overflow-y-auto">
                    {tenants.map((t) => (
                      <label
                        key={String(t.id)}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                      >
                        <Checkbox
                          checked={tenantFilter === String(t.id)}
                          onCheckedChange={() =>
                            handleTenantFilter(tenantFilter === String(t.id) ? null : String(t.id))
                          }
                          className="data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                  {tenantFilter ? (
                    <button
                      className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => handleTenantFilter(null)}
                    >
                      Effacer
                    </button>
                  ) : null}
                </PopoverContent>
              </Popover>
            ) : null}

            {/* Client filter */}
            {canFilterByClient && (clients?.length ?? 0) > 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between text-xs font-normal">
                    {clientFilter
                      ? (clients?.find((c) => c.id === clientFilter)?.name ?? 'Client')
                      : 'Tous les clients'}
                    <ChevronDown className="ml-1 size-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="space-y-0.5">
                    {(clients ?? []).map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted text-xs"
                      >
                        <Checkbox
                          checked={clientFilter === c.id}
                          onCheckedChange={() =>
                            handleClientFilter(clientFilter === c.id ? null : c.id)
                          }
                          className="data-[state=checked]:bg-(--color-primary) data-[state=checked]:border-(--color-primary)"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                  {clientFilter ? (
                    <button
                      className="mt-1.5 w-full rounded px-2 py-1 text-center text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => handleClientFilter(null)}
                    >
                      Effacer
                    </button>
                  ) : null}
                </PopoverContent>
              </Popover>
            ) : null}

            <Button
              onClick={handleOpenCreate}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
            >
              <Plus className="size-4" />
              Nouveau
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        {(selectedRoles.length > 0 || draftStatus !== 'all') && (
          <div className="flex flex-wrap gap-1.5">
            {selectedRoleLabels.map((opt) => (
              <Badge
                key={opt.value}
                variant="outline"
                className="h-6 gap-1 px-2 text-xs font-normal bg-(--color-primary) text-white"
              >
                {opt.label}
                <button
                  onClick={() => handleRoleToggle(opt.value)}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                  aria-label="Retirer le filtre rôle"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {draftStatus !== 'all' && selectedStatusLabel && (
              <Badge
                variant="outline"
                className="h-6 gap-1 px-2 text-xs font-normal bg-(--color-primary) text-white"
              >
                {selectedStatusLabel}
                <button
                  onClick={() => handleStatusFilter('all')}
                  className="ml-0.5 rounded-sm opacity-60 hover:opacity-100"
                  aria-label="Retirer le filtre statut"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <AdminUsersTable
          users={data?.data ?? []}
          isLoading={isLoading}
          hasQuery={hasQuery || clientFilter !== null || (canSelectTenant && tenantFilter !== null)}
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
