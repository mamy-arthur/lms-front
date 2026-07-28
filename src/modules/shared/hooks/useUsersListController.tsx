'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type UseUsersListControllerOptions = {
  includeTenantFilter?: boolean;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultPageSize?: number;
  debounceMs?: number;
};

export function useUsersListController<TUser, TParams = Record<string, unknown>>(
  opts?: UseUsersListControllerOptions,
) {
  const {
    includeTenantFilter = false,
    defaultSortBy = 'created_at',
    defaultSortDir = 'desc',
    defaultPageSize = 12,
    debounceMs = 400,
  } = opts ?? {};

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TUser | undefined>(undefined);

  const [draftSearch, setDraftSearch] = useState('');
  const [draftRole, setDraftRole] = useState('all');
  const [draftStatus, setDraftStatus] = useState('all');
  const [draftTenant, setDraftTenant] = useState('all');

  type ParamsState = TParams & Record<string, unknown>;
  const [params, setParams] = useState<ParamsState>(
    () => ({ sort_by: defaultSortBy, sort_dir: defaultSortDir }) as unknown as ParamsState,
  );

  const applySearch = useCallback(
    (search: string, role: string, status: string, tenant: string) => {
      const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
      setParams((prev) => ({
        ...prev,
        q: search || undefined,
        role: role !== 'all' ? role : undefined,
        is_active: isActive,
        ...(includeTenantFilter ? { tenant_id: tenant !== 'all' ? tenant : undefined } : {}),
        page: 0,
      }));
    },
    [includeTenantFilter],
  );

  // Debounce sur la recherche texte
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applySearch(draftSearch, draftRole, draftStatus, draftTenant);
    }, debounceMs);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [draftSearch, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Application immédiate pour les filtres (rôle, statut, tenant)
  const handleSearch = useCallback(() => {
    applySearch(draftSearch, draftRole, draftStatus, draftTenant);
  }, [applySearch, draftSearch, draftRole, draftStatus, draftTenant]);

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

  const hasQuery = !!(
    draftSearch ||
    draftRole !== 'all' ||
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
    draftStatus,
    setDraftStatus,
    draftTenant,
    setDraftTenant,
    params,
    setParams,
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
  } as const;
}
