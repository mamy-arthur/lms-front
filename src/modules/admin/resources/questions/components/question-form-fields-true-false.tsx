'use client';

import { Check } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import type { FormValues } from './question-form-data';

interface TrueFalseFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsTrueFalse({ form }: TrueFalseFieldsProps) {
  const correctAnswer = form.watch('correctAnswer');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 border-b border-border/10 pb-4">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Réponse correcte</p>
      </div>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-background/95 p-4 ring-1 ring-border/10">
        <FieldRoot
          control={form.control}
          name="correctAnswer"
          render={({ field }) => (
            <FieldGroup className="space-y-2">
              <FieldLabel className="text-xs">Réponse correcte</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('correctAnswer', true)}
                    className={
                      field.value === true
                        ? 'gap-1.5 text-muted-foreground border-(--color-primary) hover:border-(--color-primary)/80'
                        : 'gap-1.5 text-muted-foreground'
                    }
                  >
                    {field.value === true && <Check className="size-3.5" />}
                    Vrai
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('correctAnswer', false)}
                    className={
                      field.value === false
                        ? 'gap-1.5 text-muted-foreground border-(--color-primary) hover:border-(--color-primary)/80'
                        : 'gap-1.5 text-muted-foreground'
                    }
                  >
                    {field.value === false && <Check className="size-3.5" />}
                    Faux
                  </Button>
                </div>
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
      </div>
    </div>
  );
}
