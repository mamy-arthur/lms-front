'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { cn } from '@/shared/lib/cn';
import { Separator } from '@/components/ui/separator';
import { useCompetencyCategoriesQuery } from '@/modules/admin/resources/modules/hooks/useCompetencyCategoriesQuery';
import { useModulesInfinite } from '@/modules/admin/resources/modules/hooks/useModulesInfinite';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { ModuleCard } from './ModuleCard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleItem = {
  id: string;
  name: string;
  category: string;
  description?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usedModuleIds: string[];
  onSelect: (module: ModuleItem) => void;
};

export function SelectModuleDialog({ open, onOpenChange, usedModuleIds, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<ModuleItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 400);

  const {
    data: modulesPages,
    isLoading: isLoadingCompetencies,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useModulesInfinite(
    { q: debouncedSearch || undefined, category_ids: activeCategoryIds.length > 0 ? activeCategoryIds.join(',') : undefined },
    open,
  );

  const catalog = useMemo(() => {
    const seen = new Set<string>();
    return (modulesPages?.pages.flatMap((p) => p.data) ?? []).filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [modulesPages]);

  const { data: categoriesData } = useCompetencyCategoriesQuery(open);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesData ?? []) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categoriesData]);

  const availableCategories = categoriesData ?? [];

  return (
   <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-2xl flex h-[70vh] flex-col">
    <DialogHeader className="shrink-0">
      <DialogTitle>Ajouter un module</DialogTitle>
      <DialogDescription>
        Choisissez la compétence à ajouter à votre parcours
      </DialogDescription>
    </DialogHeader>

    <Separator />

    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Search */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une compétence…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {/* Category filter */}
      {availableCategories.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategoryIds([])}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              activeCategoryIds.length === 0
                ? 'bg-(--color-primary) text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            Tous
          </button>

          {availableCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setActiveCategoryIds((prev) =>
                  prev.includes(cat.id)
                    ? prev.filter((id) => id !== cat.id)
                    : [...prev, cat.id],
                )
              }
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeCategoryIds.includes(cat.id)
                  ? 'bg-(--color-primary) text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Module grid - scrollable */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto pr-1"
      >
        <div className="flex flex-col gap-2">
          {isLoadingCompetencies && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoadingCompetencies &&
            catalog.map((comp) => {
              const isAdded = usedModuleIds.includes(comp.id);
              const hasCourses = comp.courseIds.length > 0;

              const categoryName = comp.category_id
                ? (categoryMap.get(comp.category_id) ?? null)
                : null;

              return (
                <ModuleCard
                  key={comp.id}
                  id={comp.id}
                  shortname={comp.shortname}
                  categoryName={categoryName}
                  courseCount={comp.courseIds.length}
                  isSelected={selected?.id === comp.id}
                  isAdded={isAdded}
                  hasCourses={hasCourses}
                  isExpanded={expandedId === comp.id}
                  onSelect={() =>
                    setSelected({
                      id: comp.id,
                      name: comp.shortname,
                      category: categoryName ?? '',
                    })
                  }
                  onToggleExpand={() =>
                    setExpandedId((prev) =>
                      prev === comp.id ? null : comp.id,
                    )
                  }
                />
              );
            })}

          {!isLoadingCompetencies && catalog.length === 0 && (
            <p className="py-10 text-center text-xs text-muted-foreground">
              Aucune compétence ne correspond à votre recherche.
            </p>
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasNextPage && !isFetchingNextPage && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs"
              onClick={() => fetchNextPage()}
            >
              Voir plus
            </Button>
          )}
        </div>
      </div>
    </div>

    <DialogFooter className="shrink-0">
      <Button
        variant="ghost"
        onClick={() => {
          setSelected(null);
          onOpenChange(false);
        }}
      >
        Annuler
      </Button>

      <Button
        disabled={!selected}
        onClick={() => {
          if (!selected) return;
          onSelect(selected);
          setSelected(null);
          onOpenChange(false);
        }}
        className="bg-(--color-primary) hover:bg-(--color-primary)/50"
      >
        <Plus className="size-4" />
        Ajouter le module
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

  );
}
