'use client';

import { useCallback, useState } from 'react';

export interface QuestionSearchParams {
  q?: string;
  quiz_id?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export type UseQuestionListControllerOptions = {
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultPageSize?: number;
};

export function useQuestionListController<TQuestion>(opts?: UseQuestionListControllerOptions) {
  const { defaultSortBy = 'name', defaultSortDir = 'asc', defaultPageSize = 25 } = opts ?? {};

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TQuestion | undefined>();

  const [draftSearch, setDraftSearch] = useState('');

  const [params, setParams] = useState<QuestionSearchParams>({
    sort_by: defaultSortBy,
    sort_dir: defaultSortDir,
    page: 0,
    page_size: defaultPageSize,
  });

  const handleSearch = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      q: draftSearch || undefined,
      page: 0,
    }));
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
    setEditingQuestion(undefined);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingQuestion(undefined);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsDrawerOpen(false);
    setEditingQuestion(undefined);
  }, []);

  const handleEdit = useCallback((question: TQuestion) => {
    setEditingQuestion(question);
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
  const hasQuery = !!draftSearch;

  return {
    isDrawerOpen,
    editingQuestion,
    draftSearch,
    setDraftSearch,
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
