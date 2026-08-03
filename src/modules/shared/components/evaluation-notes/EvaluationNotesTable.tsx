'use client';

import { useMemo, useState } from 'react';
import {
  DataTable,
  type DataTableColumn,
  type DataTableEmptyState,
  type DataTableSort,
} from '@/shared/components/ui/DataTable';

interface EvaluationNotesTableProps<TRow extends { id: string | number }> {
  data: TRow[];
  columns: DataTableColumn<TRow>[];
  isLoading?: boolean;
  emptyState?: DataTableEmptyState;
  initialSort?: DataTableSort;
  hasQuery?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: TRow) => void;
}

export function EvaluationNotesTable<TRow extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  emptyState,
  initialSort,
  hasQuery = false,
  page: externalPage,
  pageSize: externalPageSize,
  total: externalTotal,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: EvaluationNotesTableProps<TRow>) {
  const [sort, setSort] = useState<DataTableSort | undefined>(initialSort);

  const page = externalPage ?? 0;
  const pageSize = externalPageSize ?? data.length;
  const total = externalTotal ?? data.length;

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const handleSort = (column: string) => {
    setSort((previous) => {
      if (!previous || previous.column !== column) {
        return { column, direction: 'asc' };
      }

      return { column, direction: previous.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  return (
    <section className="space-y-3">
      <DataTable
        data={paginatedData}
        columns={columns}
        isLoading={isLoading}
        sort={sort}
        onSort={handleSort}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange ?? (() => {})}
        onPageSizeChange={onPageSizeChange ?? (() => {})}
        emptyState={emptyState}
        hasQuery={hasQuery}
        hidePaginationWhenSinglePage={true}
        onRowClick={onRowClick}
      />
    </section>
  );
}
