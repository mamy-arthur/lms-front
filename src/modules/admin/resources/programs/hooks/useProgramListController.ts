'use client';

import { useCallback, useState } from 'react';
import type { LearningPathListParams } from '@/shared/api/learning-paths.api';

export type UseProgramListControllerOptions = {
  defaultPageSize?: number;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
};

export function useProgramListController(opts?: UseProgramListControllerOptions) {
  const { defaultPageSize = 25, defaultSortBy = 'name', defaultSortDir = 'asc' } = opts ?? {};

  const [params, setParams] = useState<LearningPathListParams>({
    page: 1,
    per_page: defaultPageSize,
    sort_by: defaultSortBy,
    sort_order: defaultSortDir,
  });
  const [draftSearch, setDraftSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPathId, setEditingPathId] = useState<string | undefined>();
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);

  const selectedCategories = params.category_ids ? params.category_ids.split(',') : [];

  const handleSearch = useCallback(() => {
    setParams((prev) => ({ ...prev, q: draftSearch || undefined, page: 1 }));
  }, [draftSearch]);

  const handleSort = useCallback((column: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    if (value === 'all') {
      setParams((prev) => ({ ...prev, category_ids: undefined, page: 1 }));
      return;
    }
    setParams((prev) => {
      const current = prev.category_ids ? prev.category_ids.split(',') : [];
      const next = current.includes(value)
        ? current.filter((c) => c !== value)
        : [...current, value];
      return { ...prev, category_ids: next.length > 0 ? next.join(',') : undefined, page: 1 };
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setParams((prev) => ({ ...prev, per_page: newSize, page: 1 }));
  }, []);

  const openNew = useCallback(() => {
    setEditingPathId(undefined);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingPathId(id);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingPathId(undefined);
  }, []);

  const page = (params.page ?? 1) - 1;
  const sort = {
    column: params.sort_by ?? defaultSortBy,
    direction: (params.sort_order ?? defaultSortDir) as 'asc' | 'desc',
  };
  const hasQuery = !!(params.q || params.category_ids);

  return {
    params,
    draftSearch,
    setDraftSearch,
    selectedCategories,
    drawerOpen,
    editingPathId,
    categoriesDrawerOpen,
    setCategoriesDrawerOpen,
    handleSearch,
    handleSort,
    handleCategoryChange,
    handlePageChange,
    handlePageSizeChange,
    openNew,
    openEdit,
    closeDrawer,
    page,
    pageSize: params.per_page ?? defaultPageSize,
    sort,
    hasQuery,
  } as const;
}
