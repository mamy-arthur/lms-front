'use client';

import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useFormState, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FormValues } from '../validation';

interface MatchingFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsMatching({ form }: MatchingFieldsProps) {
  const {
    fields: pairFields,
    append: appendPair,
    remove: removePair,
  } = useFieldArray({
    control: form.control,
    name: 'pairs',
  });

  const autoWeight = pairFields.length > 0 ? Math.round(100 / pairFields.length) : 0;
  const watchedPairs = useWatch({ control: form.control, name: 'pairs' });

  // useFormState creates a proper subscription in this child component.
  const { submitCount } = useFormState({ control: form.control });
  const [pairsError, setPairsError] = useState<string | null>(null);

  useEffect(() => {
    if (submitCount === 0) {
      setPairsError(null);
      return;
    }

    if ((watchedPairs ?? []).length < 2) {
      setPairsError('Ajoutez au moins 2 paires');
    } else {
      setPairsError(null);
    }
  }, [watchedPairs, submitCount]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border/10 pb-4">
        <div>
          {pairFields.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {pairFields.length} paire{pairFields.length === 1 ? '' : 's'}
              </p>
              <span className="px-2 py-0.5 text-xs font-medium text-(--color-primary)">
                {autoWeight}%&nbsp;/ paire (auto)
              </span>
            </div>
          )}
        </div>
        <Button type="button" variant="outline" onClick={() => appendPair({ left: '', right: '' })}>
          <Plus className="mr-1 size-3" />
          Ajouter une paire
        </Button>
      </div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden ring-1 ring-border/10">
        {pairFields.length === 0 ? (
          <div className="rounded-3xl bg-muted/10 p-4 text-xs text-muted-foreground">
            Aucune paire ajoutée. Cliquez sur "Ajouter une paire" pour commencer.
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto pb-3">
              <div className="space-y-3">
                {pairFields.map((field, index) => {
                  const isFilled =
                    !!watchedPairs?.[index]?.left?.trim() && !!watchedPairs?.[index]?.right?.trim();
                  return (
                    <div
                      key={field.id}
                      className={cn(
                        'group rounded-sm border p-3 transition-all duration-200',
                        isFilled
                          ? 'border-(--color-primary) bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:border-primary/20 hover:bg-muted/30 hover:shadow-sm',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Numéro de paire */}
                        <div className="mt-6 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-[10px] font-medium text-muted-foreground">
                          {index + 1}
                        </div>

                        {/* Gauche */}
                        <div className="flex-1">
                          <FieldRoot
                            control={form.control}
                            name={`pairs.${index}.left`}
                            render={({ field: f }) => (
                              <FieldGroup className="flex flex-col space-y-1">
                                <FieldLabel className="text-xs font-medium text-muted-foreground">
                                  Gauche
                                </FieldLabel>
                                <FieldContent>
                                  <Input
                                    {...f}
                                    aria-label={`Gauche ${index + 1}`}
                                    placeholder="Terme…"
                                    className="h-9 border shadow-none focus-visible:ring-1"
                                  />
                                </FieldContent>
                                <FieldError />
                              </FieldGroup>
                            )}
                          />
                        </div>

                        {/* Séparateur */}
                        <ArrowRight className="mt-6 size-4 shrink-0 text-muted-foreground/40" />

                        {/* Droite */}
                        <div className="flex-1">
                          <FieldRoot
                            control={form.control}
                            name={`pairs.${index}.right`}
                            render={({ field: f }) => (
                              <FieldGroup className="flex flex-col space-y-1">
                                <FieldLabel className="text-xs font-medium text-muted-foreground">
                                  Droite
                                </FieldLabel>
                                <FieldContent>
                                  <Input
                                    {...f}
                                    aria-label={`Droite ${index + 1}`}
                                    placeholder="Définition…"
                                    className="h-9 border shadow-none focus-visible:ring-1"
                                  />
                                </FieldContent>
                                <FieldError />
                              </FieldGroup>
                            )}
                          />
                        </div>

                        {/* Suppression */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePair(index)}
                          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Supprimer la paire ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {pairsError && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {pairsError}
          </p>
        )}
      </div>
    </div>
  );
}
