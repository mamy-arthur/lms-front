'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useModulesInfinite } from '@/modules/admin/resources/modules/hooks/useModulesInfinite';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { adminModulesApi } from '@/modules/admin/resources/modules/api';
import { normalizeModule } from '@/modules/admin/resources/modules/types';
import type { FormValues } from '../validation';
import { ChevronDown, Loader2, MessageSquarePlus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommonFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsCommon({ form }: CommonFieldsProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    data: pages,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useModulesInfinite({ q: debouncedSearch || undefined }, pickerOpen);

  const modules = useMemo(() => {
    const seen = new Set<string>();
    return (pages?.pages.flatMap((p) => p.data) ?? []).filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [pages]);

  // reset search when picker closes
  useEffect(() => {
    if (!pickerOpen) setSearch('');
  }, [pickerOpen]);

  const selectedId = useWatch({ control: form.control, name: 'competencyId' });
  // Label cache: populated from picker selections or from the detail fetch below
  const [labelCache, setLabelCache] = useState<Record<string, string>>({});

  // When the picker loads modules, populate the cache for all visible items
  useEffect(() => {
    if (modules.length === 0) return;
    setLabelCache((prev) => {
      const next = { ...prev };
      for (const m of modules) next[m.id] = m.shortname;
      return next;
    });
  }, [modules]);

  // Fetch by ID to resolve the label when editing (selectedId set but label not cached)
  const needsFetch = !!selectedId && !labelCache[selectedId];
  const { data: fetchedModule } = useQuery({
    queryKey: ['admin', 'modules', 'by-id', selectedId],
    queryFn: async () => normalizeModule((await adminModulesApi.getById(selectedId!)).data),
    enabled: needsFetch,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    if (fetchedModule)
      setLabelCache((prev) => ({ ...prev, [fetchedModule.id]: fetchedModule.shortname }));
  }, [fetchedModule]);

  const selectedLabel = selectedId ? labelCache[selectedId] : undefined;

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 60) fetchNextPage();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="flex flex-col gap-4 ">
        <FieldRoot
          control={form.control}
          name="competencyId"
          render={({ field }) => (
            <FieldGroup className="space-y-2">
              <FieldLabel className="text-xs">Module *</FieldLabel>
              <FieldContent>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-xs font-normal"
                    >
                      <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
                        {selectedLabel ?? 'Sélectionner un module…'}
                      </span>
                      <ChevronDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher…"
                        className="h-9 border-0 px-0 text-xs shadow-none focus-visible:ring-0"
                        autoFocus
                      />
                    </div>
                    <div ref={listRef} onScroll={handleScroll} className="max-h-60 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : modules.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          Aucun module trouvé.
                        </p>
                      ) : (
                        modules.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              field.onChange(m.id);
                              setLabelCache((prev) => ({ ...prev, [m.id]: m.shortname }));
                              setPickerOpen(false);
                            }}
                            className={cn(
                              'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted',
                              field.value === m.id && 'bg-muted',
                            )}
                          >
                            <span className="text-xs font-medium">{m.shortname}</span>
                            {m.category_name && (
                              <span className="text-xs text-muted-foreground">
                                {m.category_name}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                      {isFetchingNextPage && (
                        <div className="flex justify-center py-2">
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
        <FieldRoot
          control={form.control}
          name="question"
          render={({ field }) => (
            <FieldGroup className="space-y-2">
              <FieldLabel className="text-xs">Question *</FieldLabel>
              <FieldContent>
                <Textarea
                  autoFocus
                  aria-label="Question"
                  className="min-h-24 resize-y text-foreground/80"
                  {...field}
                />
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
        <div className="rounded-lg border mt-2">
          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="size-4 text-muted-foreground" />

              <div>
                <p className="text-xs font-medium">Commentaires</p>
                <p className="text-xs text-muted-foreground">Ajouter des commentaires optionnels</p>
              </div>
            </div>

            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                commentsOpen && 'rotate-180',
              )}
            />
          </button>

          {commentsOpen && (
            <div className="space-y-4 border-t px-4 py-4">
              <FieldRoot
                control={form.control}
                name="commentIfCorrect"
                render={({ field }) => (
                  <FieldGroup className="space-y-2">
                    <FieldLabel className="text-xs">
                      Commentaire affiché si la réponse est correcte
                    </FieldLabel>

                    <FieldContent>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        aria-label="Commentaire si correct"
                        className="min-h-16 resize-y text-foreground/70"
                      />
                    </FieldContent>

                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="commentIfIncorrect"
                render={({ field }) => (
                  <FieldGroup className="space-y-2">
                    <FieldLabel className="text-xs">
                      Commentaire affiché si la réponse est incorrecte
                    </FieldLabel>

                    <FieldContent>
                      <Textarea
                        {...field}
                        value={field.value ?? ''}
                        aria-label="Commentaire si incorrect"
                        className="min-h-16 resize-y text-foreground/70"
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
