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
  const [draftRole, setDraftRole] = useState('all');
  const [draftStatus, setDraftStatus] = useState('all');
  const [draftTenant, setDraftTenant] = useState('all');

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
    const isActive =
      draftStatus === 'active' ? true : draftStatus === 'inactive' ? false : undefined;
    setParams((prev) => ({
      ...prev,
      q: draftSearch || undefined,
      role: draftRole !== 'all' ? draftRole : undefined,
      is_active: isActive,
      ...(includeTenantFilter
        ? { tenant_id: draftTenant !== 'all' ? draftTenant : undefined }
        : {}),
      page: 0,
    }));
  }, [draftSearch, draftRole, draftStatus, draftTenant, includeTenantFilter]);

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
