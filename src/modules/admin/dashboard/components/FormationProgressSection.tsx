'use client';

import { useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { DashboardFormationSort } from '@/shared/types/dashboard.types';
import { useEditorDashboardFormationsQuery } from '../hooks/useEditorDashboardQuery';
import { FormationProgressCards } from './FormationProgressCards';

const PER_PAGE = 20;

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
  // Seule la saisie est débouncée : tri et pagination sont des actions discrètes.
  const debouncedSearch = useDebounce(filters.search);
  const query = useEditorDashboardFormationsQuery({
    q: debouncedSearch.trim(),
    sort_by: filters.sort,
    page: filters.page,
    per_page: PER_PAGE,
  });

  return (
    <FormationProgressCards
      formations={query.data?.formations ?? []}
      total={query.data?.meta.total ?? 0}
      page={filters.page}
      perPage={query.data?.meta.per_page ?? PER_PAGE}
      search={filters.search}
      sort={filters.sort}
      onSearchChange={(search) => setFilters((previous) => ({ ...previous, search, page: 1 }))}
      onSortChange={(sort) => setFilters((previous) => ({ ...previous, sort, page: 1 }))}
      onPageChange={(page) => setFilters((previous) => ({ ...previous, page }))}
      isLoading={query.isPending}
      isFetching={query.isFetching || debouncedSearch !== filters.search}
      isError={query.isError}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
