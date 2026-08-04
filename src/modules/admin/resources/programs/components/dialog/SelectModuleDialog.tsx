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
import { useModules } from '@/modules/admin/resources/modules/hooks/useModules';
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

  const { data: modulesResult, isLoading: isLoadingCompetencies } = useModules(
    open ? { page_size: 500 } : undefined,
  );
  const catalog = modulesResult?.data ?? [];

  const { data: categoriesData } = useCompetencyCategoriesQuery(open);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesData ?? []) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categoriesData]);

  const filtered = useMemo(() => {
    return catalog.filter((comp) => {
      const matchSearch = comp.shortname.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategoryId === null || comp.category_id === activeCategoryId;
      return matchSearch && matchCat;
    });
  }, [catalog, search, activeCategoryId]);

  const availableCategories = useMemo(() => {
    const ids = new Set(catalog.map((c) => c.category_id));
    return (categoriesData ?? []).filter((cat) => ids.has(cat.id));
  }, [catalog, categoriesData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un module</DialogTitle>
          <DialogDescription>Choisissez la compétence à ajouter à votre parcours</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex flex-col gap-3">
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
          <div className="flex flex-col gap-2 overflow-y-auto pr-1">
            {isLoadingCompetencies && (
              <div className="col-span-2 flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoadingCompetencies &&
              filtered.map((comp) => {
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
            {!isLoadingCompetencies && filtered.length === 0 && (
              <p className="col-span-2 py-10 text-center text-xs text-muted-foreground">
                Aucune compétence ne correspond à votre recherche.
              </p>
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
