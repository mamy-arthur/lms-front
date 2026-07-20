'use client';

import { useCallback, useState } from 'react';

export interface UseFormationTableControllerOptions {
  defaultPageSize?: number;
}

interface GroupPaginationState {
  page: number;
  pageSize: number;
}

export function useFormationTableController(opts?: UseFormationTableControllerOptions) {
  const { defaultPageSize = 25 } = opts ?? {};

  const [groups, setGroups] = useState<Record<string, GroupPaginationState>>({});

  const getGroupState = useCallback(
    (groupId: string): GroupPaginationState =>
      groups[groupId] ?? { page: 0, pageSize: defaultPageSize },
    [groups, defaultPageSize],
  );

  const handlePageChange = useCallback((groupId: string, page: number) => {
    setGroups((prev) => {
      const existing = prev[groupId];
      return { ...prev, [groupId]: { page, pageSize: existing?.pageSize ?? 25 } };
    });
  }, []);

  const handlePageSizeChange = useCallback((groupId: string, pageSize: number) => {
    setGroups((prev) => ({
      ...prev,
      [groupId]: { page: 0, pageSize },
    }));
  }, []);

  const resetGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setGroups({});
  }, []);

  return {
    getGroupState,
    handlePageChange,
    handlePageSizeChange,
    resetGroup,
    resetAll,
  } as const;
}
