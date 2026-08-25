'use client';

import { Check, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useFormState, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { QuestionType } from '../types';
import type { FormValues } from '../validation';
import { largestRemainder } from '../validation';

interface ChoicesFieldsProps {
  form: UseFormReturn<FormValues>;
  selectedType: QuestionType;
}

export function QuestionFormFieldsChoices({ form, selectedType }: ChoicesFieldsProps) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const watchedOptions = useWatch({ control: form.control, name: 'options' });

  const isMultipleChoice = selectedType === 'multiple_choice';
  const totalChoices = optionFields.length;

  // useFormState creates a proper subscription in this child component, so
  // submitCount is reactive (unlike form.formState.submitCount which is not).
  const { submitCount } = useFormState({ control: form.control });
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Recompute the array-level error whenever options or submitCount change.
  useEffect(() => {
    if (submitCount === 0) {
      setOptionsError(null);
      return;
    }

    const options = watchedOptions ?? [];
    const correctCount = options.filter((o) => o?.isCorrect).length;

    if (options.length < 2) {
      setOptionsError('Ajoutez au moins 2 choix');
    } else if (selectedType === 'single_choice' && correctCount !== 1) {
      setOptionsError('Exactement 1 choix doit être correct');
    } else if (selectedType === 'multiple_choice' && correctCount < 1) {
      setOptionsError('Au moins un choix doit être correct');
    } else {
      setOptionsError(null);
    }
  }, [watchedOptions, submitCount, selectedType]);
  const correctCount = watchedOptions?.filter((o) => o?.isCorrect).length ?? 0;

  const positiveUsed =
    watchedOptions
      ?.filter((o) => o?.isCorrect)
      .reduce((sum, o) => sum + (o?.weightPercentage ?? 0), 0) ?? 0;
  const negativeUsed =
    watchedOptions
      ?.filter((o) => !o?.isCorrect)
      .reduce((sum, o) => sum + (o?.weightPercentage ?? 0), 0) ?? 0;

  // Precompute normalized final weights for correct options (real-time preview)
  const correctWeightsMap = new Map<number, number>(); // optionIndex → position
  const correctRawWeights: number[] = [];
  watchedOptions?.forEach((o, i) => {
    if (o?.isCorrect) {
      correctWeightsMap.set(i, correctRawWeights.length);
      correctRawWeights.push(o?.weightPercentage ?? 0);
    }
  });
  const normalizedCorrectWeights = isMultipleChoice ? largestRemainder(correctRawWeights, 100) : [];

  const toggleCorrect = useCallback(
    (index: number) => {
      const current = form.getValues(`options.${index}.isCorrect`);
      if (selectedType === 'single_choice' && !current) {
        // unmark all, then mark this one
        const values = form.getValues('options');
        values.forEach((_, i) => form.setValue(`options.${i}.isCorrect`, false));
      }
      form.setValue(`options.${index}.isCorrect`, !current);
      if (isMultipleChoice) {
        form.setValue(`options.${index}.weightPercentage`, 0);
      }
    },
    [form, selectedType, isMultipleChoice],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border/10 pb-4">
        <div>
          {optionFields.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{totalChoices} choix</p>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium',
                  correctCount === 0 ? 'text-muted-foreground' : 'text-(--color-primary)',
                )}
              >
                {correctCount} bonne{correctCount === 1 ? '' : 's'} réponse
                {correctCount === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => appendOption({ label: '', isCorrect: false, weightPercentage: 0 })}
        >
          <Plus className="mr-1 size-3" />
          Ajouter un choix
        </Button>
      </div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden  ring-1 ring-border/10">
        {optionFields.length === 0 ? (
          <div className="rounded-3xl bg-muted/10 p-4 text-xs text-muted-foreground">
            Aucun choix ajouté. Cliquez sur "Ajouter un choix" pour commencer.
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto pb-3">
              <div className="space-y-3">
                {optionFields.map((field, index) => {
                  const isCorrect = watchedOptions?.[index]?.isCorrect ?? false;
                  const currentWeight = watchedOptions?.[index]?.weightPercentage ?? 0;
                  // Exclude this field's own value from the running totals so that
                  // max/min is always based on what the *other* fields have used.
                  const otherCorrectSum = positiveUsed - (isCorrect ? currentWeight : 0);
                  const otherIncorrectSum = negativeUsed - (!isCorrect ? currentWeight : 0);
                  const maxAllowed = isCorrect ? 100 - otherCorrectSum : 0;
                  const minAllowed = !isCorrect ? -100 - otherIncorrectSum : 0;
                  const normalizedPreview = isCorrect
                    ? (normalizedCorrectWeights[correctWeightsMap.get(index) ?? -1] ?? 0)
                    : null;
                  return (
                    <div
                      key={field.id}
                      onClick={() => toggleCorrect(index)}
                      className={cn(
                        'group cursor-pointer rounded-sm border p-3 transition-all duration-200',
                        isCorrect
                          ? 'border-(--color-primary) bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:border-primary/20 hover:bg-muted/30 hover:shadow-sm',
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Bouton réponse correcte */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCorrect(index);
                          }}
                          className={cn(
                            'mt-1 h-5 w-5 rounded-full border transition-all',
                            isCorrect
                              ? 'border-(--color-primary) bg-(--color-primary) text-primary-foreground hover:bg-(--color-primary) hover:text-white'
                              : 'border-muted-foreground/30 hover:border-(--color-primary) hover:text-primary',
                          )}
                        >
                          {isCorrect && <Check className="h-4 w-4" />}
                        </Button>

                        {/* Input */}
                        <div
                          className="flex flex-1 items-start gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex-1">
                            <FieldRoot
                              control={form.control}
                              name={`options.${index}.label`}
                              render={({ field: f }) => (
                                <FieldGroup className="flex flex-col space-y-1">
                                  <FieldLabel className="text-xs font-medium text-muted-foreground">
                                    Réponse {String.fromCharCode(65 + index)}
                                  </FieldLabel>
                                  <FieldContent>
                                    <Input
                                      {...f}
                                      placeholder="Saisissez une réponse..."
                                      className="h-9 border shadow-none focus-visible:ring-1"
                                    />
                                  </FieldContent>
                                  <FieldError />
                                </FieldGroup>
                              )}
                            />
                          </div>
                          {isMultipleChoice && (
                            <>
                              <div className="w-24 shrink-0">
                                <FieldRoot
                                  control={form.control}
                                  name={`options.${index}.weightPercentage`}
                                  render={({ field: f }) => (
                                    <FieldGroup className="flex flex-col space-y-1">
                                      <FieldLabel className="text-xs font-medium text-muted-foreground">
                                        Poids
                                      </FieldLabel>
                                      <FieldContent>
                                        <Input
                                          type="number"
                                          min={minAllowed}
                                          max={maxAllowed}
                                          placeholder="0"
                                          value={f.value ?? 0}
                                          onChange={(e) => {
                                            if (e.target.value === '') {
                                              f.onChange(0);
                                              return;
                                            }
                                            const parsed = parseInt(e.target.value, 10);
                                            if (isNaN(parsed)) return;
                                            f.onChange(
                                              Math.max(minAllowed, Math.min(maxAllowed, parsed)),
                                            );
                                          }}
                                          className="h-9 border shadow-none focus-visible:ring-1 text-center"
                                        />
                                      </FieldContent>
                                      <FieldError />
                                    </FieldGroup>
                                  )}
                                />
                              </div>
                              {isCorrect && normalizedPreview !== null && (
                                <div className="w-16 shrink-0">
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Final
                                    </span>
                                    <div
                                      className={cn(
                                        'flex h-9 items-center justify-center rounded-sm border text-xs font-semibold',
                                        'border-(--color-primary) bg-primary/5 text-(--color-primary)',
                                      )}
                                    >
                                      {normalizedPreview}%
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Suppression */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeOption(index);
                          }}
                          className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
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

        {optionsError && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {optionsError}
          </p>
        )}
      </div>
    </div>
  );
}
