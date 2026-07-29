'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Loader2, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useCompetencyCategoriesQuery } from '@/modules/admin/resources/modules/hooks/useCompetencyCategoriesQuery';
import { useLearningPathCompetencyAssociationsQuery } from '../../hooks/useLearningPathCompetencyAssociationsQuery';

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

  const { data: catalog, isLoading: isLoadingCompetencies } =
    useLearningPathCompetencyAssociationsQuery(open);

  const { data: categoriesData } = useCompetencyCategoriesQuery(open);

  // Build a category id→name map for display
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categoriesData ?? []) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categoriesData]);

  const filtered = useMemo(() => {
    return (catalog ?? []).filter((comp) => {
      const matchSearch = comp.shortname.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategoryId === null || comp.category_id === activeCategoryId;
      return matchSearch && matchCat;
    });
  }, [catalog, search, activeCategoryId]);

  // Only show categories present in the full (unfiltered) competency list
  const availableCategories = useMemo(() => {
    const ids = new Set((catalog ?? []).map((c) => c.category_id));
    return (categoriesData ?? []).filter((cat) => ids.has(cat.id));
  }, [catalog, categoriesData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un module</DialogTitle>
          <DialogDescription>Choisissez la compétence à ajouter à votre parcours</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une compétence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category filter */}
          {availableCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCategoryId(null)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  activeCategoryId === null
                    ? 'bg-(--color-primary) text-(--color-primary-foreground)'
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
                      ? 'bg-(--color-primary) text-(--color-primary-foreground)'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Competency grid */}
          <div className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {isLoadingCompetencies && (
              <div className="col-span-2 flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoadingCompetencies &&
              filtered.map((comp) => {
                const isAdded = usedModuleIds.includes(comp.id);
                const hasCourses = comp.courses_count > 0;
                const isLinkedToOtherLp = comp.is_linked && !usedModuleIds.includes(comp.id);
                const isDisabled = isAdded || !hasCourses || isLinkedToOtherLp;
                const categoryName = comp.category_id
                  ? (categoryMap.get(comp.category_id) ?? null)
                  : null;
                return (
                  <Tooltip key={comp.id}>
                    <TooltipTrigger asChild>
                      <span className="block">
                        <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() =>
                            !isDisabled &&
                            setSelected({
                              id: comp.id,
                              name: comp.shortname,
                              category: categoryName ?? '',
                            })
                          }
                          className={cn(
                            'flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-colors',
                            isAdded
                              ? 'cursor-not-allowed border-border bg-muted/40 opacity-60'
                              : selected?.id === comp.id
                                ? 'border-(--color-primary) bg-(--color-primary)/5 ring-1 ring-(--color-primary)/30 cursor-pointer'
                                : 'border-border bg-card hover:border-(--color-primary)/50 cursor-pointer',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <BookOpen className="size-3.5 shrink-0 text-(--color-primary)" />
                              <span className="truncate text-xs font-semibold">
                                {comp.shortname}
                              </span>
                            </div>
                            {isAdded && (
                              <Badge variant="secondary" className="shrink-0 text-[10px]">
                                Déjà ajouté
                              </Badge>
                            )}
                            {!isAdded && !hasCourses && (
                              <Badge className="shrink-0 text-[10px] border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertCircle className="size-2.5" />
                                Sans cours
                              </Badge>
                            )}
                            {!isAdded && hasCourses && isLinkedToOtherLp && (
                              <Badge className="shrink-0 text-[10px] border border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                <AlertCircle className="size-2.5" />
                                Déjà lié
                              </Badge>
                            )}
                          </div>
                          {categoryName && (
                            <Badge variant="outline" className="w-fit text-[10px]">
                              {categoryName}
                            </Badge>
                          )}
                        </button>
                      </span>
                    </TooltipTrigger>
                    {!hasCourses && !isAdded && (
                      <TooltipContent
                        side="bottom"
                        className="border-amber-500 bg-amber-500 text-white [&>svg]:fill-amber-500"
                      >
                        <AlertCircle className="size-3 shrink-0" />
                        Ce module ne contient aucun cours et ne peut pas être ajouté
                      </TooltipContent>
                    )}
                    {hasCourses && isLinkedToOtherLp && !isAdded && (
                      <TooltipContent
                        side="bottom"
                        className="border-orange-500 bg-orange-500 text-white [&>svg]:fill-orange-500"
                      >
                        <AlertCircle className="size-3 shrink-0" />
                        Ce module est déjà lié à un autre parcours
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            {!isLoadingCompetencies && filtered.length === 0 && (
              <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">
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
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            <Plus />
            Ajouter le module
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
