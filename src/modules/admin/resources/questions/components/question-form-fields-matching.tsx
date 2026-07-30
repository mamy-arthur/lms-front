'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { FormValues } from './question-form-data';

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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground/70 mt-0.5 font-base text-xs">
            Minimum 2 paires requises
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => appendPair({ left: '', right: '' })}>
          <Plus className="mr-1 size-3" />
          Ajouter une paire
        </Button>
      </div>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background/95 mt-5">
        <div className="flex-1 min-h-0 overflow-y-auto pb-3">
          {pairFields.length === 0 ? (
            <div className="rounded-2xl bg-muted/10 p-4 text-xs text-muted-foreground">
              Aucune paire. Cliquez sur "Ajouter une paire" pour commencer.
            </div>
          ) : (
            <div className="space-y-2">
              {pairFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-3xl bg-background/95 ring-1 ring-border/10"
                >
                  <FieldRoot
                    control={form.control}
                    name={`pairs.${index}.left`}
                    render={({ field: f }) => (
                      <FieldGroup className="space-y-1">
                        <FieldLabel className="text-xs">Gauche *</FieldLabel>
                        <FieldContent>
                          <Input
                            aria-label={`Gauche ${index + 1}`}
                            {...f}
                            className="text-foreground/70"
                          />
                        </FieldContent>
                        <FieldError />
                      </FieldGroup>
                    )}
                  />

                  <FieldRoot
                    control={form.control}
                    name={`pairs.${index}.right`}
                    render={({ field: f }) => (
                      <FieldGroup className="space-y-1">
                        <div className="flex items-center justify-between">
                          <FieldLabel className="text-xs">Droite *</FieldLabel>
                          <span className="rounded-full bg-orange-500 -translate-x-2 px-2 py-0.5 text-[10px] font-medium text-white">
                            {Math.round(100 / pairFields.length)}%
                          </span>
                        </div>
                        <FieldContent>
                          <Input
                            aria-label={`Droite ${index + 1}`}
                            {...f}
                            className="text-foreground/70"
                          />
                        </FieldContent>
                        <FieldError />
                      </FieldGroup>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-1 size-7 text-muted-foreground hover:text-destructive"
                    aria-label={`Supprimer la paire ${index + 1}`}
                    onClick={() => removePair(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {(form.formState.errors.pairs?.root?.message || form.formState.errors.pairs?.message) && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {form.formState.errors.pairs?.root?.message ??
                String(form.formState.errors.pairs?.message ?? '')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
