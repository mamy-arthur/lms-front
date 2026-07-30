'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { FormationCard } from '@/modules/shared/components/store/FormationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCartActions } from '@/modules/portal/resources/cart/hooks/useCartActions';
import { useShopLearningPathsQuery } from './hooks/useShopLearningPathsQuery';
import { useShopLearningPathCategoriesQuery } from './hooks/useShopLearningPathCategoriesQuery';

const PAGE_SIZE = 12;

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
        {/* Barre de recherche */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPerPage(PAGE_SIZE);
            }}
            className="pl-8"
          />
        </div>

        {/* Badges catégories */}
        {(categoriesQuery.data?.data.length ?? 0) > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {categoriesQuery.data!.data.map((cat) => {
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
                    'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-(--color-primary) bg-(--color-primary) text-white'
                      : 'border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  {cat.name}
                </button>
              );
            })}

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
                <X className="size-3" />
                Réinitialiser
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Grille */}
      {shopQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((lp) => {
              const cartItem = findItem(lp.id);

              return (
                <FormationCard
                  key={lp.id}
                  id={lp.id}
                  title={lp.name}
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
