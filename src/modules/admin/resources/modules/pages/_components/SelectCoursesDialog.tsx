'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useCategoryData } from '@/modules/shared/components/courses/hooks/useCategoryData';
import { useCoursesInfinite } from '@/modules/shared/components/courses/hooks/useCoursesInfinite';
import type { Course } from '@/modules/shared/components/courses/types';
import { CourseRow } from './select-courses-dialog/CourseRow';
import { FilterPill } from './select-courses-dialog/FilterPill';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCourseIds: string[];
  onConfirm: (courses: Course[]) => void;
};

export function SelectCoursesDialog({ open, onOpenChange, selectedCourseIds, onConfirm }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [pending, setPending] = useState<Course[]>([]);

  const debouncedSearch = useDebounce(search, 400);
  const { categoriesQuery } = useCategoryData();

  const {
    data: pages,
    isLoading,
    isSuccess,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useCoursesInfinite({ q: debouncedSearch || undefined, category_ids: activeCategoryId }, open);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setActiveCategoryId(null);
      setPending([]);
    }
  }, [open]);

  const courses = useMemo(() => pages?.pages.flatMap((p) => p.data) ?? [], [pages]);
  const pendingIds = useMemo(() => new Set(pending.map((c) => c.id)), [pending]);
  const categories = categoriesQuery.data ?? [];

  const toggle = (course: Course) => {
    if ((course.contentCount ?? 0) <= 0 || selectedCourseIds.includes(course.id)) return;

    setPending((prev) =>
      prev.some((c) => c.id === course.id)
        ? prev.filter((c) => c.id !== course.id)
        : [...prev, course],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[60vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter des cours</DialogTitle>
          <DialogDescription>
            Sélectionnez les cours à ajouter au module. Seuls les cours contenant au moins un
            contenu peuvent être ajoutés.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un cours…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterPill
              active={activeCategoryId === null}
              onClick={() => setActiveCategoryId(null)}
            >
              Toutes catégories
            </FilterPill>
            {categories.map((cat) => (
              <FilterPill
                key={cat.id}
                active={activeCategoryId === cat.id}
                onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
              >
                {cat.name}
              </FilterPill>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {isError && !isFetchNextPageError && (
            <Alert variant="destructive">
              <AlertDescription>
                Impossible de charger les cours. Veuillez réessayer.
              </AlertDescription>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Réessayer
              </Button>
            </Alert>
          )}
          {isSuccess && courses.length === 0 && (
            <p className="py-10 text-center text-xs text-muted-foreground">
              Aucun cours ne correspond à votre recherche.
            </p>
          )}
          {!isLoading && (
            <div className="space-y-1 pr-1">
              {courses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  isPending={pendingIds.has(course.id)}
                  isAlreadyAdded={selectedCourseIds.includes(course.id)}
                  onToggle={() => toggle(course)}
                />
              ))}
              {isFetchNextPageError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Impossible de charger les cours suivants. Les cours déjà chargés restent
                    disponibles.
                  </AlertDescription>
                </Alert>
              )}
              {(hasNextPage || isFetchNextPageError) && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-1 w-full text-xs"
                  onClick={() => fetchNextPage()}
                  disabled={isFetching}
                >
                  {isFetchingNextPage && <Loader2 className="size-3 animate-spin" />}
                  {isFetchNextPageError ? 'Réessayer' : 'Voir plus'}
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={pending.length === 0}
            onClick={() => {
              onConfirm(pending);
              onOpenChange(false);
            }}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            <Plus className="size-4" />
            {pending.length > 0 ? `Ajouter ${pending.length} cours` : 'Ajouter des cours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
