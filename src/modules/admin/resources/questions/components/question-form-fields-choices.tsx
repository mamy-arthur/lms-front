'use client';

import { Check, Plus, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { QuestionType } from '../types';
import type { FormValues } from './question-form-data';

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

  const totalChoices = optionFields.length;
  const correctCount = watchedOptions?.filter((o) => o?.isCorrect).length ?? 0;

  const toggleCorrect = useCallback(
    (index: number) => {
      const current = form.getValues(`options.${index}.isCorrect`);
      if (selectedType === 'single_choice' && !current) {
        // unmark all, then mark this one
        const values = form.getValues('options');
        values.forEach((_, i) => form.setValue(`options.${i}.isCorrect`, false));
      }
      form.setValue(`options.${index}.isCorrect`, !current);
    },
    [form, selectedType],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between border-b border-border/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Réponses</p>
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
          size="xs"
          className="text-(--color-primary) hover:text-(--color-primary)"
          onClick={() => appendOption({ label: '', isCorrect: false })}
        >
          <Plus className="mr-1 size-3" />
          Ajouter un choix
        </Button>
      </div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-background/95 px-2 ring-1 ring-border/10">
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

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        'flex items-center gap-3 rounded-3xl border p-3 transition-colors',
                        isCorrect
                          ? 'border-(--color-primary)/40 bg-(--color-primary)/5'
                          : 'border-border/10 bg-background/95',
                      )}
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/50 text-xs text-muted-foreground">
                        {index + 1}
                      </span>

                      <FieldRoot
                        control={form.control}
                        name={`options.${index}.label`}
                        render={({ field: f }) => (
                          <FieldGroup className="flex-1 space-y-1">
                            <FieldLabel className="sr-only">Libellé {index + 1}</FieldLabel>
                            <FieldContent>
                              <Input
                                aria-label={`Libellé ${index + 1}`}
                                placeholder="Réponse *"
                                className="text-foreground/70"
                                {...f}
                              />
                            </FieldContent>
                            <FieldError />
                          </FieldGroup>
                        )}
                      />

                      <Button
                        type="button"
                        variant={isCorrect ? 'default' : 'outline'}
                        size="icon"
                        className={cn(
                          'size-7 shrink-0',
                          isCorrect
                            ? 'bg-(--color-primary) text-white hover:bg-(--color-primary)/80'
                            : '',
                        )}
                        aria-label={isCorrect ? 'Réponse correcte' : 'Marquer comme correct'}
                        onClick={() => toggleCorrect(index)}
                      >
                        {isCorrect && <Check className="size-4" />}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Supprimer le choix ${index + 1}`}
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {form.formState.errors.options && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {String(form.formState.errors.options.message ?? '')}
          </p>
        )}
      </div>
    </div>
  );
}
