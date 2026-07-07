'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { FormationCard } from '@/modules/shared/components/store/FormationCard';
import { MOCK_STORE_FORMATIONS, MOCK_STORE_CATEGORIES } from '@/shared/mocks/store.mock';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
      </div>
    </div>
  );
}

export function StorePage() {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading] = useState(false);

  const hasFilters = search.trim() !== '' || selectedCategories.size > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_STORE_FORMATIONS.filter((f) => {
      const matchSearch = q === '' || f.title.toLowerCase().includes(q);
      const matchCategory = selectedCategories.size === 0 || selectedCategories.has(f.categoryId);
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategories]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setVisibleCount(PAGE_SIZE);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedCategories(new Set());
    setVisibleCount(PAGE_SIZE);
  };

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
        {/* Barre de recherche */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher une formation..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="pl-8"
          />
        </div>

        {/* Badges catégories */}
        <div className="flex flex-wrap items-center gap-2">
          {MOCK_STORE_CATEGORIES.map((cat) => {
            const active = selectedCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
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
      </div>

      {/* Grille */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <FormationCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <p className="text-sm">Aucune formation ne correspond à votre recherche.</p>
          <Button variant="link" size="sm" onClick={handleReset} className="mt-2">
            Voir toutes les formations
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((formation) => (
              <FormationCard
                key={formation.id}
                title={formation.title}
                author={formation.author}
                category={formation.category}
                coverImage={formation.coverImage}
                price={formation.price}
                updatedAt={formation.updatedAt}
                enrolledCompanies={formation.enrolledCompanies}
                moduleCount={formation.moduleCount}
                evaluationCount={formation.evaluationCount}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Voir plus ({filtered.length - visibleCount} restantes)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
