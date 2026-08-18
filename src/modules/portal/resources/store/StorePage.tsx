'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutGrid, List, Search } from 'lucide-react';
import { FormationCard } from '@/modules/shared/components/store/FormationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCartActions } from '@/modules/portal/resources/cart/hooks/useCartActions';
import { useShopLearningPathsQuery } from './hooks/useShopLearningPathsQuery';
import { useShopLearningPathCategoriesQuery } from './hooks/useShopLearningPathCategoriesQuery';

const PAGE_SIZE = 25;

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
        <Skeleton className="h-8 w-full mt-3" />
      </div>
    </div>
  );
}

export function StorePage() {
  const router = useRouter();
  const { add, increase, decrease, setQuantity, findItem, isMutatingFor } = useCartActions();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [perPage, setPerPage] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const shopQuery = useShopLearningPathsQuery({
    q: debouncedSearch || undefined,
    category_id: selectedCategoryId ?? undefined,
    per_page: perPage,
    page: 1,
  });

  const categoriesQuery = useShopLearningPathCategoriesQuery();

  const items = shopQuery.data?.data ?? [];
  const total = shopQuery.data?.meta.total ?? 0;
  const hasMore = items.length < total;
  const hasFilters = search.trim() !== '' || selectedCategoryId !== null;

  const handleReset = () => {
    setSearch('');
    setSelectedCategoryId(null);
    setPerPage(PAGE_SIZE);
  };

  const categoryName = (id: string | null) =>
    categoriesQuery.data?.data.find((c) => c.id === id)?.name ?? id ?? '';

  const handleAddToCart = async (id: string) => {
    const lp = items.find((item) => item.id === id);
    if (!lp) {
      toast.error('Formation introuvable.');
      return;
    }
    await add(lp.id);
  };

  const handleOpenDetails = (id: string) => {
    router.push(`/store/${id}`);
  };

  return (
    <div className="mx-auto w-full">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Boutique</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Parcourez les formations disponibles et ajoutez-les à votre panier.
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
                'flex items-center rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                selectedCategoryId === null
                  ? 'bg-(--color-primary) text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              Toutes
            </button>
            {(categoriesQuery.data?.data ?? []).map((cat) => {
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
                  setPerPage(PAGE_SIZE);
                }}
                className="h-8 w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Trier par : Plus récent <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-400 hover:text-slate-600',
                )}
                aria-label="Vue grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list'
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-400 hover:text-slate-600',
                )}
                aria-label="Vue liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grille */}
      {shopQuery.isLoading ? (
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid grid-cols-1',
          )}
        >
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
          <div
            className={cn(
              'gap-4',
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid grid-cols-1',
            )}
          >
            {items.map((lp) => {
              const cartItem = findItem(lp.id);

              return (
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
                  enrolledCompanies={0}
                  moduleCount={lp.competencies.length}
                  evaluationCount={0}
                  onAddToCart={handleAddToCart}
                  onOpenDetails={handleOpenDetails}
                  cartQuantity={cartItem?.quantity}
                  onIncreaseQuantity={cartItem ? () => increase(cartItem.id) : undefined}
                  onDecreaseQuantity={cartItem ? () => decrease(cartItem.id) : undefined}
                  onQuantityChange={
                    cartItem ? (quantity) => setQuantity(cartItem.id, quantity) : undefined
                  }
                  isCartMutating={isMutatingFor({
                    learningPathId: lp.id,
                    cartItemId: cartItem?.id,
                  })}
                />
              );
            })}
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
