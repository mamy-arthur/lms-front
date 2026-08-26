'use client';

import { ChevronDown, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserSearch } from '@modules/shared/components/users';
import { UserFormDrawer } from '../components/UserFormDrawer';
import { useClientUsersQuery } from '../hooks/useClientUsersQuery';
import type { ClientUser, ClientUserSearchParams } from '../types';
import { ClientUsersTable } from './_components/client-users-table';
import { useUsersListController } from '@/modules/shared/hooks/useUsersListController';
import { useToggleClientUserActive } from '../hooks/useToggleClientUserActive';
import { useDeleteClientUser } from '../hooks/useDeleteClientUser';
import { useDeleteConfirm } from '@/modules/shared/hooks/useDeleteConfirm';

const ROLE_OPTIONS = [
  { value: 'CLIENT_MANAGER', label: 'Responsable' },
  { value: 'TRAINEE', label: 'Stagiaire' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
] as const;

export function ClientUserList() {
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
    handleSearchOnly,
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
  } = useUsersListController<ClientUser, ClientUserSearchParams>({ defaultPageSize: 25 });

  const { data: queryResult } = useClientUsersQuery(params);
  const toggleActive = useToggleClientUserActive();
  const deleteClientUser = useDeleteClientUser();
  const { openConfirm: confirmDelete, dialog: deleteDialog } = useDeleteConfirm((id) =>
    deleteClientUser.mutate(id),
  );

  const selectedRoleLabels = ROLE_OPTIONS.filter((o) => selectedRoles.includes(o.value));
  const selectedStatusLabel = STATUS_OPTIONS.find((o) => o.value === draftStatus)?.label;

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
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
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

            <Button
              onClick={handleOpenCreate}
              className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground shrink-0"
            >
              <Plus className="size-4" />
              Nouveau
            </Button>
          </div>
        </div>

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
          onDelete={(user) => confirmDelete(user)}
        />
      </div>

      <UserFormDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSuccess={handleSuccess}
        user={editingUser}
      />

      {deleteDialog}
    </div>
  );
}


