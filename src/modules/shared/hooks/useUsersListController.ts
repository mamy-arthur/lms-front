'use client';

import { useCallback, useMemo, useState } from 'react';
import { useUsersListParams, type UsersListParamsOptions } from './useUsersListParams';

export type UseUsersListControllerOptions = UsersListParamsOptions;

export function useUsersListController<TUser, TParams = Record<string, unknown>>(
  opts?: UseUsersListControllerOptions,
) {
  const {
    includeTenantFilter = false,
    defaultSortBy = 'created_at',
    defaultSortDir = 'desc',
    defaultPageSize = 25,
  } = opts ?? {};

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TUser | undefined>(undefined);

  const { params, setParams, returnTo } = useUsersListParams<TParams>(opts ?? {});
  const [searchDraft, setSearchDraft] = useState<{ applied: unknown; value: string } | null>(null);
  // Discard obsolete drafts so history cannot reactivate them when an old query returns.
  if (searchDraft && searchDraft.applied !== params.q) {
    setSearchDraft(null);
  }
  const draftSearch =
    searchDraft && searchDraft.applied === params.q
      ? searchDraft.value
      : ((params.q as string) ?? '');
  const setDraftSearch = useCallback(
    (value: string) => {
      setSearchDraft({ applied: params.q, value });
    },
    [params.q],
  );
  const draftRole = (params.roles as string) || 'all';
  const draftStatus =
    params.is_active === true ? 'active' : params.is_active === false ? 'inactive' : 'all';
  const [localDraftTenant, setDraftTenantState] = useState('all');
  const draftTenant = includeTenantFilter
    ? (params.tenant_id as string) || 'all'
    : localDraftTenant;

  // Application explicite uniquement (bouton Appliquer ou touche Entrée)
  const handleSearch = useCallback(() => {
    const isActive =
      draftStatus === 'active' ? true : draftStatus === 'inactive' ? false : undefined;
    const tenantId = includeTenantFilter && draftTenant !== 'all' ? draftTenant : undefined;

    setParams((prev) => {
      // Restoring the input from the URL can trigger its debounce; do not reset the restored page.
      if (
        prev.q === (draftSearch || undefined) &&
        prev.is_active === isActive &&
        prev.tenant_id === tenantId
      ) {
        return prev;
      }
      return {
        ...prev,
        q: draftSearch || undefined,
        is_active: isActive,
        tenant_id: tenantId,
        page: 0,
      };
    });
  }, [draftSearch, draftStatus, includeTenantFilter, draftTenant, setParams]);

  const setDraftRole = useCallback(
    (role: string) => {
      setParams((prev) => ({
        ...prev,
        roles: role !== 'all' ? role : undefined,
        page: 0,
      }));
    },
    [setParams],
  );

  const setDraftStatus = useCallback(
    (status: string) => {
      const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
      setParams((prev) => ({
        ...prev,
        is_active: isActive,
        page: 0,
      }));
    },
    [setParams],
  );

  const setDraftTenant = useCallback(
    (tenant: string) => {
      setDraftTenantState(tenant);
      if (!includeTenantFilter) return;
      setParams((prev) => ({
        ...prev,
        tenant_id: tenant !== 'all' ? tenant : undefined,
        page: 0,
      }));
    },
    [includeTenantFilter, setParams],
  );

  const handleRoleToggle = useCallback(
    (role: string) => {
      setParams((prev) => {
        const current = prev.roles ? (prev.roles as string).split(',') : [];
        const next = current.includes(role)
          ? current.filter((r) => r !== role)
          : [...current, role];
        return { ...prev, roles: next.length > 0 ? next.join(',') : undefined, page: 0 };
      });
    },
    [setParams],
  );

  const handleStatusFilter = useCallback(
    (status: string) => {
      setDraftStatus(status);
    },
    [setDraftStatus],
  );

  // Utilisé par le debounce de la barre de recherche — n'applique que le filtre `q` sans toucher aux autres filtres
  const handleSearchOnly = useCallback(() => {
    setParams((prev) =>
      prev.q === (draftSearch || undefined)
        ? prev
        : { ...prev, q: draftSearch || undefined, page: 0 },
    );
  }, [draftSearch, setParams]);

  const handleSort = useCallback(
    (column: string) => {
      setParams((prev) => ({
        ...prev,
        sort_by: column,
        sort_dir: prev.sort_by === column && prev.sort_dir === 'asc' ? 'desc' : 'asc',
        page: 0,
      }));
    },
    [setParams],
  );

  const handleOpenCreate = useCallback(() => {
    setEditingUser(undefined);
    setIsDrawerOpen(true);
  }, []);
  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingUser(undefined);
  }, []);
  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingUser(undefined);
  }, []);
  const handleEdit = useCallback((user: TUser) => {
    setEditingUser(user);
    setIsDrawerOpen(true);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setParams((prev) => ({ ...prev, page: newPage }));
    },
    [setParams],
  );
  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setParams((prev) => ({ ...prev, page_size: newSize, page: 0 }));
    },
    [setParams],
  );

  const page = (params.page as number) ?? 0;
  const pageSize = (params.page_size as number) ?? defaultPageSize;

  const sort = useMemo(
    () => ({
      column: (params.sort_by as string) ?? defaultSortBy,
      direction: (params.sort_dir as 'asc' | 'desc') ?? defaultSortDir,
    }),
    [params.sort_by, params.sort_dir, defaultSortBy, defaultSortDir],
  );

  const selectedRoles = useMemo(
    () => (params.roles ? (params.roles as string).split(',') : []),
    [params.roles],
  );

  const hasQuery = !!(
    draftSearch ||
    draftRole !== 'all' ||
    selectedRoles.length > 0 ||
    draftStatus !== 'all' ||
    (includeTenantFilter && draftTenant !== 'all')
  );

  return {
    isDrawerOpen,
    editingUser,
    draftSearch,
    setDraftSearch,
    draftRole,
    setDraftRole,
    selectedRoles,
    draftStatus,
    setDraftStatus,
    draftTenant,
    setDraftTenant,
    params,
    setParams,
    returnTo,
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
  } as const;
}
