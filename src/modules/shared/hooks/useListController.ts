'use client';

import { useCallback, useState } from 'react';

export interface ListSearchParams {
  q?: string;
  category?: string;
  tenant_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export type UseListControllerOptions = {
  includeTenantFilter?: boolean;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultPageSize?: number;
};

export function useListController<TItem>(opts?: UseListControllerOptions) {
  const {
    includeTenantFilter = false,
    defaultSortBy = 'name',
    defaultSortDir = 'asc',
    defaultPageSize = 25,
  } = opts ?? {};

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TItem | undefined>();

  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState<string[]>(['all']);
  const [draftTenant, setDraftTenant] = useState('all');

  const [params, setParams] = useState<ListSearchParams>({
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

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (value === 'all') {
        setDraftCategory(['all']);
        setParams((prev) => ({ ...prev, category: undefined, page: 0 }));
        return;
      }
      const without = draftCategory.filter((c) => c !== 'all');
      const next = without.includes(value)
        ? without.filter((c) => c !== value)
        : [...without, value];
      const newCategory = next.length === 0 ? ['all'] : next;
      const selected = newCategory.filter((c) => c !== 'all');
      // Two independent state updates instead of one nested inside the other —
      // updater functions must stay pure (React re-invokes them in Strict Mode).
      setDraftCategory(newCategory);
      setParams((prev) => ({
        ...prev,
        category: selected.length > 0 ? selected.join(',') : undefined,
        page: 0,
      }));
    },
    [draftCategory],
  );

  const handleOpenCreate = useCallback(() => {
    setEditingItem(undefined);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingItem(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingItem(undefined);
  }, []);

  const handleEdit = useCallback((item: TItem) => {
    setEditingItem(item);
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
    editingItem,
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
