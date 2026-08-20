'use client';

import { useCallback, useState } from 'react';

export interface ModuleSearchParams {
  q?: string;
  category?: string;
  tenant_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export type UseModuleListControllerOptions = {
  includeTenantFilter?: boolean;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultPageSize?: number;
};

export function useModuleListController<TModule>(opts?: UseModuleListControllerOptions) {
  const {
    includeTenantFilter = false,
    defaultSortBy = 'name',
    defaultSortDir = 'asc',
    defaultPageSize = 25,
  } = opts ?? {};

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TModule | undefined>();

  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState<string[]>(['all']);
  const [draftTenant, setDraftTenant] = useState('all');

  const [params, setParams] = useState<ModuleSearchParams>({
    sort_by: defaultSortBy,
    sort_dir: defaultSortDir,
    page: 0,
    page_size: defaultPageSize,
  });

  const handleSearch = useCallback(() => {
    const selected = draftCategory.filter((c) => c !== 'all');
    setParams((prev) => ({
      ...prev,
      q: draftSearch || undefined,
      category: selected.length > 0 ? selected.join(',') : undefined,
      ...(includeTenantFilter
        ? { tenant_id: draftTenant !== 'all' ? draftTenant : undefined }
        : {}),
      page: 0,
    }));
  }, [draftSearch, draftCategory, draftTenant, includeTenantFilter]);

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_dir: prev.sort_by === column && prev.sort_dir === 'asc' ? 'desc' : 'asc',
      page: 0,
    }));
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    if (value === 'all') {
      setDraftCategory(['all']);
      setParams((prev) => ({ ...prev, category: undefined, page: 0 }));
      return;
    }
    setDraftCategory((prev) => {
      const without = prev.filter((c) => c !== 'all');
      const next = without.includes(value)
        ? without.filter((c) => c !== value)
        : [...without, value];
      return next.length === 0 ? ['all'] : next;
    });
    setParams((prev) => {
      const current = prev.category ? prev.category.split(',') : [];
      const next = current.includes(value)
        ? current.filter((c) => c !== value)
        : [...current, value];
      return { ...prev, category: next.length > 0 ? next.join(',') : undefined, page: 0 };
    });
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingModule(undefined);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingModule(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingModule(undefined);
  }, []);

  const handleEdit = useCallback((module: TModule) => {
    setEditingModule(module);
    setIsDrawerOpen(true);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => setParams((prev) => ({ ...prev, page: newPage })),
    [],
  );

  const handlePageSizeChange = useCallback((newSize: number) => {
    setParams((prev) => ({ ...prev, page_size: newSize, page: 0 }));
  }, []);

  const page = params.page ?? 0;
  const pageSize = params.page_size ?? defaultPageSize;
  const sort = {
    column: params.sort_by ?? defaultSortBy,
    direction: (params.sort_dir as 'asc' | 'desc') ?? defaultSortDir,
  };
  const hasQuery = !!(
    draftSearch ||
    draftCategory.some((c) => c !== 'all') ||
    (includeTenantFilter && draftTenant !== 'all')
  );

  return {
    isDrawerOpen,
    editingModule,
    draftSearch,
    setDraftSearch,
    draftCategory,
    setDraftCategory,
    handleCategoryChange,
    draftTenant,
    setDraftTenant,
    params,
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
    sort,
    hasQuery,
  } as const;
}
