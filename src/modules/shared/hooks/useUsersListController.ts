'use client';

import { useCallback, useMemo, useState } from 'react';

export type UseUsersListControllerOptions = {
  includeTenantFilter?: boolean;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultPageSize?: number;
};

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

  const [draftSearch, setDraftSearch] = useState('');
  const [draftRole, setDraftRoleState] = useState('all');
  const [draftStatus, setDraftStatusState] = useState('all');
  const [draftTenant, setDraftTenantState] = useState('all');

  type ParamsState = TParams & Record<string, unknown>;
  const [params, setParams] = useState<ParamsState>(
    () =>
      ({
        sort_by: defaultSortBy,
        sort_dir: defaultSortDir,
        page_size: defaultPageSize,
      }) as unknown as ParamsState,
  );

  // Application explicite uniquement (bouton Appliquer ou touche Entrée)
  const handleSearch = useCallback(() => {
    const isActive = draftStatus === 'active' ? true : draftStatus === 'inactive' ? false : undefined;
    const tenantId = includeTenantFilter && draftTenant !== 'all' ? draftTenant : undefined;

    setParams((prev) => ({
      ...prev,
      q: draftSearch || undefined,
      is_active: isActive,
      tenant_id: tenantId,
      page: 0,
    }));
  }, [draftSearch, draftStatus, includeTenantFilter, draftTenant]);

  const setDraftRole = useCallback((role: string) => {
    setDraftRoleState(role);
    setParams((prev) => ({
      ...prev,
      roles: role !== 'all' ? role : undefined,
      page: 0,
    }));
  }, []);

  const setDraftStatus = useCallback((status: string) => {
    setDraftStatusState(status);
    const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
    setParams((prev) => ({
      ...prev,
      is_active: isActive,
      page: 0,
    }));
  }, []);

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
    [includeTenantFilter],
  );

  const handleRoleToggle = useCallback((role: string) => {
    setParams((prev) => {
      const current = prev.roles ? (prev.roles as string).split(',') : [];
      const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
      return { ...prev, roles: next.length > 0 ? next.join(',') : undefined, page: 0 };
    });
  }, []);

  const handleStatusFilter = useCallback(
    (status: string) => {
      setDraftStatus(status);
    },
    [setDraftStatus],
  );

  // Utilisé par le debounce de la barre de recherche — n'applique que le filtre `q` sans toucher aux autres filtres
  const handleSearchOnly = useCallback(() => {
    setParams((prev) => ({ ...prev, q: draftSearch || undefined, page: 0 }));
  }, [draftSearch]);

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_dir: prev.sort_by === column && prev.sort_dir === 'asc' ? 'desc' : 'asc',
      page: 0,
    }));
  }, []);

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

  const handlePageChange = useCallback((newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  }, []);
  const handlePageSizeChange = useCallback((newSize: number) => {
    setParams((prev) => ({ ...prev, page_size: newSize, page: 0 }));
  }, []);

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
