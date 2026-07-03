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

  const watchedOptions = useWatch({
    control: form.control,
    name: 'options',
  });

  // Seule source de vérité : score. "Correct" n'est qu'un libellé
  // d'affichage dérivé, jamais envoyé au backend.
  const isOptionCorrect = useCallback(
    (score: number) => (selectedType === 'single_choice' ? score >= 100 : score > 0),
    [selectedType],
  );

  const totalChoices = watchedOptions?.length ?? optionFields.length;
  const correctCount = watchedOptions?.filter((o) => isOptionCorrect(o?.score ?? 0)).length ?? 0;

  const optionCount = optionFields.length;

  const helperText =
    selectedType === 'single_choice'
      ? 'Cliquez sur le bouton pour indiquer la bonne réponse.'
      : 'Cliquez sur les boutons pour indiquer une ou plusieurs bonnes réponses.';

  const handleScoreChange = useCallback(
    (index: number, value: number) => {
      const clamped = Math.min(100, Math.max(0, value));
      form.setValue(`options.${index}.score`, clamped);

      if (selectedType === 'single_choice' && clamped >= 100) {
        for (let i = 0; i < optionCount; i++) {
          if (i !== index) {
            form.setValue(`options.${i}.score`, 0);
          }
        }
      }
    },
    [form, selectedType, optionCount],
  );

  const toggleCorrect = useCallback(
    (index: number) => {
      const current = form.getValues(`options.${index}.score`) ?? 0;
      handleScoreChange(index, isOptionCorrect(current) ? 0 : 100);
    },
    [form, handleScoreChange, isOptionCorrect],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between border-b border-border/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Réponses et explications
          </p>
          <p className="mt-2 text-xs text-foreground/80">
            Définissez les réponses et marquez celles qui sont correctes.
          </p>
          {optionFields.length > 0 && (
            <>
              <div className="flex items-center gap-2">
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
            </>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="text-(--color-primary) hover:text-(--color-primary)"
          onClick={() =>
            appendOption({
              id: `opt-${Date.now()}-${Math.random()}`,
              label: '',
              isCorrect: false,
              score: 0,
              feedback: '',
            })
          }
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
                  const score = watchedOptions?.[index]?.score ?? 0;
                  const isCorrect = isOptionCorrect(score);

                  return (
                    <div
                      key={field.id}
                      className={cn(
                        'space-y-3 rounded-3xl border p-3 transition-colors',
                        isCorrect
                          ? 'border-(--color-primary)/40 bg-(--color-primary)/5'
                          : 'border-border/10 bg-background/95',
                      )}
                    >
                      <div className="grid gap-3 md:grid-cols-[auto_1fr_auto_auto] md:items-start">
                        <div className="flex items-center gap-2 self-center text-xs">
                          <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground rounded-full bg-muted/50 text-xs">
                            {index + 1}
                          </span>
                        </div>

                        <FieldRoot
                          control={form.control}
                          name={`options.${index}.label`}
                          render={({ field: f }) => (
                            <FieldGroup className="space-y-2">
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

                        {selectedType === 'single_choice' ? (
                          <Input
                            type="number"
                            readOnly
                            disabled
                            value={isCorrect ? 100 : 0}
                            aria-label={`Note ${index + 1}`}
                            className="w-[80px] text-center"
                          />
                        ) : (
                          <FieldRoot
                            control={form.control}
                            name={`options.${index}.score`}
                            render={({ field: f }) => (
                              <FieldGroup className="w-[80px] space-y-2">
                                <FieldLabel className="sr-only">Note {index + 1}</FieldLabel>
                                <FieldContent>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={1}
                                    aria-label={`Note ${index + 1}`}
                                    className="text-foreground/70"
                                    value={f.value}
                                    onChange={(e) =>
                                      handleScoreChange(index, Number(e.target.value))
                                    }
                                  />
                                </FieldContent>
                                <FieldError />
                              </FieldGroup>
                            )}
                          />
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 justify-self-end text-(--color-primary)"
                          aria-label={`Supprimer le choix ${index + 1}`}
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="size-3" />
                        </Button>

                        <Button
                          type="button"
                          variant={isCorrect ? 'default' : 'outline'}
                          size="icon"
                          className={
                            isCorrect
                              ? 'size-5 shrink-0 text-white bg-(--color-primary) hover:bg-(--color-primary)/80'
                              : 'size-5'
                          }
                          onClick={() => toggleCorrect(index)}
                        >
                          {isCorrect ? <Check className="size-4" /> : null}
                        </Button>

                        <FieldRoot
                          control={form.control}
                          name={`options.${index}.feedback`}
                          render={({ field: f }) => (
                            <FieldGroup className="space-y-2 md:col-span-3">
                              <FieldLabel className="sr-only">Explication {index + 1}</FieldLabel>
                              <FieldContent>
                                <Input
                                  aria-label={`Explication ${index + 1}`}
                                  placeholder="Explication (optionnel)"
                                  className="text-foreground/70"
                                  {...f}
                                />
                              </FieldContent>
                              <FieldError />
                            </FieldGroup>
                          )}
                        />
                      </div>
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
