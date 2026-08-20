'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
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
import { useCategoryData } from '@/modules/shared/components/courses/hooks/useCategoryData';
import type { AvailableCourse } from '../../types';
import { CourseRow } from './select-courses-dialog/CourseRow';
import { FilterPill } from './select-courses-dialog/FilterPill';

type StatusFilter = 'all' | 'available';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCourses: AvailableCourse[];
  isLoading: boolean;
  selectedCourseIds: string[];
  onConfirm: (newCourseIds: string[]) => void;
};

export function SelectCoursesDialog({
  open,
  onOpenChange,
  availableCourses,
  isLoading,
  selectedCourseIds,
  onConfirm,
}: Props) {
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const { categoriesQuery } = useCategoryData();

  useEffect(() => {
    if (!open) {
      setSearch('');
      setActiveCategoryId(null);
      setStatusFilter('all');
      setPendingIds(new Set());
    }
  }, [open]);

  const categories = useMemo(() => {
    const presentIds = new Set(availableCourses.map((c) => c.categoryId).filter(Boolean));
    return (categoriesQuery.data ?? []).filter((cat) => presentIds.has(cat.id));
  }, [availableCourses, categoriesQuery.data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return availableCourses.filter((course) => {
      if (q && !course.fullName.toLowerCase().includes(q)) return false;
      if (activeCategoryId && course.categoryId !== activeCategoryId) return false;
      if (statusFilter === 'available') {
        if (course.status === 'ALREADY_LINKED') return false;
        if (selectedCourseIds.includes(course.id)) return false;
      }
      return true;
    });
  }, [availableCourses, search, activeCategoryId, statusFilter, selectedCourseIds]);

  const toggle = (id: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[60vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter des cours</DialogTitle>
          <DialogDescription>Sélectionnez les cours à ajouter au module.</DialogDescription>
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

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            Tous
          </FilterPill>
          <FilterPill
            active={statusFilter === 'available'}
            onClick={() => setStatusFilter('available')}
          >
            Disponibles
          </FilterPill>

          {categories.length > 0 && (
            <>
              <span className="px-1 text-muted-foreground/40">|</span>
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
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="py-10 text-center text-xs text-muted-foreground">
              Aucun cours ne correspond à votre recherche.
            </p>
          )}
          {!isLoading && (
            <div className="space-y-1 pr-1">
              {filtered.map((course) => (
                <CourseRow
                  key={course.id}
                  course={course}
                  isPending={pendingIds.has(course.id)}
                  isAlreadyAdded={selectedCourseIds.includes(course.id)}
                  isLinkedElsewhere={course.status === 'ALREADY_LINKED'}
                  onToggle={() => toggle(course.id)}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={pendingIds.size === 0}
            onClick={() => {
              onConfirm(Array.from(pendingIds));
              onOpenChange(false);
            }}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            <Plus className="size-4" />
            {pendingIds.size > 0 ? `Ajouter ${pendingIds.size} cours` : 'Ajouter des cours'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
