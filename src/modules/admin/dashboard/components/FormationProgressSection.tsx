'use client';

import { useEffect, useRef, useState } from 'react';
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
  const hasMountedRef = useRef(false);

  // Ramène à la page 1 seulement une fois la recherche débouncée, pour éviter une requête
  // intermédiaire "page 1 + ancien texte" à chaque frappe quand l'utilisateur n'est pas déjà en page 1.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setFilters((previous) => (previous.page === 1 ? previous : { ...previous, page: 1 }));
  }, [debouncedSearch]);

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
      onSearchChange={(search) => setFilters((previous) => ({ ...previous, search }))}
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
