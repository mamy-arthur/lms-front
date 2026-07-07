'use client';

import { useState, useMemo } from 'react';
import { FormationCard } from '@/modules/shared/components/store/FormationCard';
import { MOCK_STORE_FORMATIONS, MOCK_STORE_CATEGORIES } from '@/shared/mocks/store.mock';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 8;
const ALL_CATEGORIES = 'all';

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
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading] = useState(false);

  const filtered = useMemo(
    () =>
      selectedCategory === ALL_CATEGORIES
        ? MOCK_STORE_FORMATIONS
        : MOCK_STORE_FORMATIONS.filter((f) => f.categoryId === selectedCategory),
    [selectedCategory],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSelectedCategory(ALL_CATEGORIES);
    setCurrentPage(1);
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
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Toutes les catégories</SelectItem>
            {MOCK_STORE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCategory !== ALL_CATEGORIES && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Grille */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <FormationCardSkeleton key={i} />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <p className="text-sm">Aucune formation disponible pour cette catégorie.</p>
          <Button variant="link" size="sm" onClick={handleReset} className="mt-2">
            Voir toutes les formations
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((formation) => (
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
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text="Précédent"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-disabled={safePage === 1}
                  className={safePage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={safePage === i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  text="Suivant"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-disabled={safePage === totalPages}
                  className={safePage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
