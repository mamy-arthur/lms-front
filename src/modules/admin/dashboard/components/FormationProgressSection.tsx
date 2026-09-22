'use client';

import { useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { DashboardFormationSort } from '@/shared/types/dashboard.types';
import { useEditorDashboardFormationsQuery } from '../hooks/useEditorDashboardQuery';
import { FormationProgressCards } from './FormationProgressCards';

export function FormationProgressSection() {
  const [filters, setFilters] = useState<{
    search: string;
    page: number;
    sort: DashboardFormationSort;
  }>({
    search: '',
    page: 1,
    sort: 'enrolled',
  });
  const debounced = useDebounce(filters);
  const query = useEditorDashboardFormationsQuery({
    q: debounced.search.trim(),
    sort_by: debounced.sort,
    page: debounced.page,
    per_page: 20,
  });

  return (
    <FormationProgressCards
      formations={query.data?.formations ?? []}
      total={query.data?.meta.total ?? 0}
      page={query.data?.meta.page ?? debounced.page}
      perPage={query.data?.meta.per_page ?? 20}
      search={filters.search}
      sort={filters.sort}
      onSearchChange={(search) => setFilters((previous) => ({ ...previous, search, page: 1 }))}
      onSortChange={(sort) => setFilters((previous) => ({ ...previous, sort, page: 1 }))}
      onPageChange={(page) => setFilters((previous) => ({ ...previous, page }))}
      isLoading={query.isPending}
      isFetching={query.isFetching || filters !== debounced}
      isError={query.isError}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
