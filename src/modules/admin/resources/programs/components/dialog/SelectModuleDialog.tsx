'use client';

import { useMemo, useState } from 'react';
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
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ModuleItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const {
    data: modulesPages,
    isLoading: isLoadingCompetencies,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useModulesInfinite(
    { q: debouncedSearch || undefined, category_id: activeCategoryId },
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
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Ajouter un module</DialogTitle>
          <DialogDescription>Choisissez la compétence à ajouter à votre parcours</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          {/* Search */}
          <div className="relative">
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
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategoryId(null)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  activeCategoryId === null
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
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    activeCategoryId === cat.id
                      ? 'bg-(--color-primary) text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Module grid */}
          <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
            {isLoadingCompetencies && (
              <div className="col-span-2 flex items-center justify-center py-12">
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
                      setExpandedId((prev) => (prev === comp.id ? null : comp.id))
                    }
                  />
                );
              })}
            {!isLoadingCompetencies && catalog.length === 0 && (
              <p className="col-span-2 py-10 text-center text-xs text-muted-foreground">
                Aucune compétence ne correspond à votre recherche.
              </p>
            )}
            {hasNextPage && (
              <Button
                variant="ghost"
                className="mt-1 w-full text-xs"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <Loader2 className="size-3 animate-spin" /> : 'Voir plus'}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
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
