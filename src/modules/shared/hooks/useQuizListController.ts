'use client';

import { useCallback, useState } from 'react';

export interface QuizSearchParams {
  q?: string;
  category?: string;
  tenant_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export type UseQuizListControllerOptions = {
  includeTenantFilter?: boolean;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultPageSize?: number;
};

export function useQuizListController<TQuiz>(opts?: UseQuizListControllerOptions) {
  const {
    includeTenantFilter = false,
    defaultSortBy = 'name',
    defaultSortDir = 'asc',
    defaultPageSize = 25,
  } = opts ?? {};

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<TQuiz | undefined>();

  const [draftSearch, setDraftSearch] = useState('');
  const [draftCategory, setDraftCategory] = useState<string[]>(['all']);
  const [draftTenant, setDraftTenant] = useState('all');

  const [params, setParams] = useState<QuizSearchParams>({
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

  const handleOpenCreate = useCallback(() => {
    setEditingQuiz(undefined);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingQuiz(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingQuiz(undefined);
  }, []);

  const handleEdit = useCallback((quiz: TQuiz) => {
    setEditingQuiz(quiz);
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
    editingQuiz,
    draftSearch,
    setDraftSearch,
    draftCategory,
    setDraftCategory,
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
