'use client';

import { useState } from 'react';
import { ChevronDown, BookOpen, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormationCard } from '@/modules/portal/resources/_shared/trainee/FormationCard';
import { useMyEnrollmentsQuery } from './hooks/useMyEnrollmentsQuery';
import { usePurchasedLearningPathCategoriesQuery } from '@/modules/portal/resources/purchased-learning-paths/hooks/usePurchasedLearningPathCategoriesQuery';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebounce } from '@/shared/hooks/useDebounce';
import type { FormationStatus } from '@/modules/portal/resources/_shared/trainee/types';

type FilterTab = 'all' | FormationStatus;
type SortKey = 'recent' | 'oldest' | 'alpha_asc' | 'alpha_desc';

const PAGE_SIZE = 12;

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En cours', value: 'in_progress' },
  { label: 'Terminées', value: 'completed' },
  { label: 'Échouées', value: 'failed' },
  { label: 'À commencer', value: 'not_started' },
];

const SORT_OPTIONS: { label: string; value: SortKey; sort_by: string; sort_dir: 'asc' | 'desc' }[] =
  [
    { label: 'Plus récent', value: 'recent', sort_by: 'enrolled_at', sort_dir: 'desc' },
    { label: 'Plus ancien', value: 'oldest', sort_by: 'enrolled_at', sort_dir: 'asc' },
    { label: 'A \u2192 Z', value: 'alpha_asc', sort_by: 'title', sort_dir: 'asc' },
    { label: 'Z \u2192 A', value: 'alpha_desc', sort_by: 'title', sort_dir: 'desc' },
  ];

export default function FormationListPage() {
  const [statusFilter, setStatusFilter] = useState<FilterTab>('all');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(PAGE_SIZE);

  const debouncedSearch = useDebounce(search, 300);
  const sortOption = SORT_OPTIONS.find((o) => o.value === sortKey)!;

  const { data, isLoading, isFetching } = useMyEnrollmentsQuery({
    per_page: perPage,
    page: 1,
    q: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sort_by: sortOption.sort_by,
    sort_dir: sortOption.sort_dir,
    category_id: categoryId ?? undefined,
  });

  const { data: categories = [] } = usePurchasedLearningPathCategoriesQuery();

  const formations = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = formations.length < total;
  const hasFilters = search.trim() !== '' || statusFilter !== 'all' || categoryId !== null;

  const resetPerPage = () => setPerPage(PAGE_SIZE);

  const currentSortLabel = sortOption.label;
  const currentStatusLabel = FILTER_TABS.find((o) => o.value === statusFilter)?.label ?? 'Toutes';

  return (
    <div className="bg-background">
      <div className="mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mes formations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Retrouvez toutes vos formations, leur progression et vos attestations.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategoryId(null);
                  resetPerPage();
                }}
                className={cn(
                  'flex items-center rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                  categoryId === null
                    ? 'bg-(--color-primary) text-white shadow-sm'
                    : 'bg-white border hover:bg-slate-50',
                )}
              >
                Toutes
              </button>
              {categories.map((cat) => {
                const active = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(active ? null : cat.id);
                      resetPerPage();
                    }}
                    className={cn(
                      'flex items-center rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                      active
                        ? 'bg-(--color-primary) text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    resetPerPage();
                  }}
                  className="h-8 w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                />
              </div>

              {/* Sort */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Trier : {currentSortLabel} <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="space-y-0.5">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={cn(
                          'w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted flex items-center justify-between',
                          sortKey === opt.value && 'font-medium text-(--color-primary)',
                        )}
                        onClick={() => {
                          setSortKey(opt.value);
                          resetPerPage();
                        }}
                      >
                        {opt.label}
                        {sortKey === opt.value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Status filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Statut : {currentStatusLabel} <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-2" align="end">
                  <div className="space-y-0.5">
                    {FILTER_TABS.map((tab) => (
                      <button
                        key={tab.value}
                        className={cn(
                          'w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted flex items-center justify-between',
                          statusFilter === tab.value && 'font-medium text-(--color-primary)',
                        )}
                        onClick={() => {
                          setStatusFilter(tab.value);
                          resetPerPage();
                        }}
                      >
                        {tab.label}
                        {statusFilter === tab.value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-sm" />
            ))}
          </div>
        ) : formations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-20">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">Aucune formation trouvée</p>
            {hasFilters && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryId(null);
                  setSearch('');
                  resetPerPage();
                }}
              >
                Voir toutes les formations
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {formations.map((formation) => (
                <FormationCard key={formation.id} formation={formation} />
              ))}
            </div>

            {hasMore && (
              <div className="flex flex-col items-center gap-1 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPerPage((n) => n + PAGE_SIZE)}
                  disabled={isFetching}
                  className="gap-2"
                >
                  Voir plus...
                  <span className="text-muted-foreground text-xs">
                    ({total - formations.length} restante{total - formations.length > 1 ? 's' : ''})
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
