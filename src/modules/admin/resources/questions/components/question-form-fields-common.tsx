'use client';

import type { UseFormReturn } from 'react-hook-form';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { FormValues } from './question-form-data';

interface CommonFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsCommon({ form }: CommonFieldsProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl bg-background/90 ring-1 ring-border/10">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Contenu de la question
        </p>
      </div>
      <section className="flex flex-col gap-4 rounded-3xl bg-muted/5 p-3 ring-1 ring-border/10">
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

        <FieldRoot
          control={form.control}
          name="commentIfCorrect"
          render={({ field }) => (
            <FieldGroup className="space-y-2">
              <FieldLabel className="text-xs">Commentaire si correct</FieldLabel>
              <FieldContent>
                <Textarea
                  aria-label="Commentaire si correct"
                  className="min-h-16 resize-y text-foreground/70"
                  {...field}
                  value={field.value ?? ''}
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
              <FieldLabel className="text-xs">Commentaire si incorrect</FieldLabel>
              <FieldContent>
                <Textarea
                  aria-label="Commentaire si incorrect"
                  className="min-h-16 resize-y text-foreground/70"
                  {...field}
                  value={field.value ?? ''}
                />
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />
      </section>
    </div>
  );
}
