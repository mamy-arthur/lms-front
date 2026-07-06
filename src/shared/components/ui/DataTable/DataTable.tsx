'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/shared/lib/cn';

export interface DataTableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
  skeleton?: React.ReactNode;
}

export interface DataTableEmptyState {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  filteredTitle?: string;
  filteredDescription?: string;
}

interface DataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  hasQuery?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: DataTableSort;
  onSort?: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRowClick?: (row: T) => void;
  emptyState?: DataTableEmptyState;
  rowTestId?: string;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function SortIcon({ column, sort }: { column: string; sort?: DataTableSort }) {
  if (!sort || sort.column !== column) {
    return <ArrowUpDown className="ml-1 size-3 shrink-0 text-muted-foreground/40" />;
  }
  return sort.direction === 'asc' ? (
    <ArrowUp className="ml-1 size-3 shrink-0 text-muted-foreground" />
  ) : (
    <ArrowDown className="ml-1 size-3 shrink-0 text-muted-foreground" />
  );
}

function EmptyState({ hasQuery, state }: { hasQuery: boolean; state?: DataTableEmptyState }) {
  if (!state) return null;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {state.icon && <div className="mb-4 rounded-full bg-muted p-4">{state.icon}</div>}
      <p className="text-sm font-medium text-foreground mb-1">
        {hasQuery ? (state.filteredTitle ?? 'Aucun résultat') : (state.title ?? '')}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {hasQuery
          ? (state.filteredDescription ??
            'Modifiez votre recherche ou vos filtres pour trouver ce que vous cherchez.')
          : (state.description ?? '')}
      </p>
    </div>
  );
}

function SkeletonCell({ width }: { width: string }) {
  return <Skeleton className={cn('h-3', width)} />;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  hasQuery = false,
  page,
  pageSize,
  total,
  sort,
  onSort,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  emptyState,
  rowTestId,
}: DataTableProps<T>) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const sortedData = useMemo(() => {
    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.column as keyof T];
      const bVal = b[sort.column as keyof T];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const cmp =
        typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal)
          : typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal));

      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const buildPages = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (page > 2) pages.push('ellipsis');
      const start = Math.max(1, page - 1);
      const end = Math.min(pageCount - 2, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < pageCount - 3) pages.push('ellipsis');
      pages.push(pageCount - 1);
    }
    return pages;
  }, [page, pageCount]);

  const skeletonCells = columns.map((col, i) => (
    <TableCell key={col.key ?? i}>{col.skeleton ?? <SkeletonCell width="w-20" />}</TableCell>
  ));

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  'text-xs font-medium uppercase tracking-wide text-muted-foreground',
                  col.sortable && onSort && 'cursor-pointer select-none hover:text-foreground',
                )}
                onClick={() => {
                  if (col.sortable) onSort?.(col.key);
                }}
              >
                <span className="inline-flex items-center">
                  {col.label}
                  {col.sortable && <SortIcon column={col.key} sort={sort} />}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">{skeletonCells}</TableRow>
          ) : sortedData.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState hasQuery={hasQuery} state={emptyState} />
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row) => (
              <TableRow
                key={row.id}
                data-testid={rowTestId}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/40 group',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>{col.render(row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Lignes par page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-transparent px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} sur {total}
            </span>
          </div>

          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Précédent"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (page > 0) onPageChange(page - 1);
                  }}
                />
              </PaginationItem>

              {buildPages().map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault();
                        onPageChange(p);
                      }}
                    >
                      {p + 1}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Suivant"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    if (page < pageCount - 1) onPageChange(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
