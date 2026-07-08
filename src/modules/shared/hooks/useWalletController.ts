'use client';

import { useCallback, useMemo, useState } from 'react';
import { defaultFilters } from '../components/wallet/WalletTransactionHistoryFilter';
import type { TransactionFilters } from '../components/wallet/WalletTransactionHistoryFilter';
import type { WalletTransactionSearchParams } from '../lib/wallet-types';

export interface UseWalletControllerOptions {
  defaultPageSize?: number;
}

export function useWalletController(opts?: UseWalletControllerOptions) {
  const { defaultPageSize = 25 } = opts ?? {};

  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const params: WalletTransactionSearchParams = useMemo(
    () => ({
      q: filters.search || undefined,
      category: filters.category !== 'all' ? filters.category : undefined,
      type: filters.type !== 'all' ? filters.type : undefined,
      refundable: filters.refundable !== 'all' ? filters.refundable : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      amountMin: filters.amountMin || undefined,
      amountMax: filters.amountMax || undefined,
      sortBy: sortColumn,
      sortDir,
      page,
      pageSize,
    }),
    [filters, sortColumn, sortDir, page, pageSize],
  );

  const handleApplyFilters = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return column;
    });
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage: number) => setPage(newPage), []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  const sort = useMemo(
    () => (sortColumn ? { column: sortColumn, direction: sortDir } : undefined),
    [sortColumn, sortDir],
  );

  const hasQuery = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return value.trim().length > 0;
      if (key === 'dateFrom' || key === 'dateTo' || key === 'amountMin' || key === 'amountMax')
        return value.trim() !== '';
      return value !== 'all';
    });
  }, [filters]);

  return {
    params,
    page,
    pageSize,
    sort,
    hasQuery,
    handleApplyFilters,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
  } as const;
}
