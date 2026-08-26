'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Search } from 'lucide-react';
import { FormationCard } from '@/modules/shared/components/store/FormationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useShopLearningPathsQuery } from './hooks/useShopLearningPathsQuery';
import { useLearningPathCategoriesQuery } from '../programs/hooks/useLearningPathCategoriesQuery';
import { Input } from '@/components/ui/input';
import type { ShopLearningPathSort } from '@/shared/types/learning-path.types';

const PAGE_SIZE = 25;

const SORT_OPTIONS: { value: ShopLearningPathSort; label: string }[] = [
  { value: 'newest', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
  { value: 'name_asc', label: 'Nom A → Z' },
  { value: 'name_desc', label: 'Nom Z → A' },
];

type PriceRangeKey = 'all' | 'free' | 'lt50' | '50_100' | '100_200' | 'gt200';

const PRICE_RANGE_OPTIONS: { value: PriceRangeKey; label: string; min?: number; max?: number }[] = [
  { value: 'all', label: 'Tous les prix' },
  { value: 'free', label: 'Gratuit', max: 0 },
  { value: 'lt50', label: 'Moins de 50 €', max: 50 },
  { value: '50_100', label: '50 – 100 €', min: 50, max: 100 },
  { value: '100_200', label: '100 – 200 €', min: 100, max: 200 },
  { value: 'gt200', label: 'Plus de 200 €', min: 200 },
];

function FormationCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2 mt-2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function StorePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(PAGE_SIZE);
  const [sort, setSort] = useState<ShopLearningPathSort>('newest');
  const [priceRange, setPriceRange] = useState<PriceRangeKey>('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const shopQuery = useShopLearningPathsQuery({
    q: debouncedSearch || undefined,
    category_id: selectedCategoryId ?? undefined,
    per_page: perPage,
    page: 1,
    sort,
    price_min: PRICE_RANGE_OPTIONS.find((o) => o.value === priceRange)?.min,
    price_max: PRICE_RANGE_OPTIONS.find((o) => o.value === priceRange)?.max,
  });

  const categoriesQuery = useLearningPathCategoriesQuery();

  const items = shopQuery.data?.data ?? [];
  const total = shopQuery.data?.meta.total ?? 0;
  const hasMore = items.length < total;
  const hasFilters = search.trim() !== '' || selectedCategoryId !== null || priceRange !== 'all';

  const handleReset = () => {
    setSearch('');
    setSelectedCategoryId(null);
    setPerPage(PAGE_SIZE);
    setSort('newest');
    setPriceRange('all');
  };

  const handleOpenDetails = (id: string) => {
    router.push(`/admin/store/${id}`);
  };

  const categoryName = (id: string | null) =>
    categoriesQuery.data?.find((c) => c.id === id)?.name ?? id ?? '';

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Plus récent';
  const currentPriceLabel =
    PRICE_RANGE_OPTIONS.find((o) => o.value === priceRange)?.label ?? 'Tous les prix';

  return (
    <div className="mx-auto w-full">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boutique</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parcourez et gérez les formations disponibles sur la plateforme.
          </p>
        </div>
      </header>

      {/* Filtres */}
      <div className="mb-6 flex flex-col gap-3">
        {/* Catégories + contrôles */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId(null);
                setPerPage(PAGE_SIZE);
              }}
              className={cn(
                'flex items-center rounded-full px-4 py-1.5 text-xs font-medium',
                selectedCategoryId === null
                  ? 'bg-(--color-primary) text-white'
                  : 'bg-white border border-slate-200  hover:bg-slate-50',
              )}
            >
              Toutes
            </button>
            {(categoriesQuery.data ?? []).map((cat) => {
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(active ? null : cat.id);
                    setPerPage(PAGE_SIZE);
                  }}
                  className={cn(
                    'flex items-center rounded-full px-4 py-1.5 text-xs font-medium',
                    active
                      ? 'bg-(--color-primary) text-white'
                      : 'bg-white border border-slate-200  hover:bg-slate-50',
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
              <Input
                type="search"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPerPage(PAGE_SIZE);
                }}
                className="h-8 w-44 rounded-lg border  pl-8 pr-3 text-xs  placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Trier : {currentSortLabel} <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => {
                      setSort(option.value);
                      setPerPage(PAGE_SIZE);
                    }}
                    className="flex items-center justify-between text-xs"
                  >
                    {option.label}
                    {sort === option.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Prix : {currentPriceLabel} <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {PRICE_RANGE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => {
                      setPriceRange(option.value);
                      setPerPage(PAGE_SIZE);
                    }}
                    className="flex items-center justify-between text-xs"
                  >
                    {option.label}
                    {priceRange === option.value && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Grille */}
      {shopQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <FormationCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <p className="text-sm">Aucune formation ne correspond à votre recherche.</p>
          {hasFilters && (
            <Button variant="link" size="sm" onClick={handleReset} className="mt-2">
              Voir toutes les formations
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((lp) => (
              <FormationCard
                key={lp.id}
                id={lp.id}
                title={lp.name}
                description={lp.description}
                author=""
                category={categoryName(lp.category_id)}
                coverImage={lp.image?.url}
                price={lp.price ?? 0}
                updatedAt={lp.updated_at}
                enrolledCompanies={lp.enrollments_count}
                moduleCount={lp.competencies_count}
                evaluationCount={lp.evaluations_count ?? 0}
                hasCertificate={lp.has_certificate}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setPerPage((p) => p + PAGE_SIZE)}
                disabled={shopQuery.isFetching}
              >
                Voir plus ({total - items.length} restantes)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
