'use client';

import { Check } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import type { FormValues } from './question-form-data';

interface TrueFalseFieldsProps {
  form: UseFormReturn<FormValues>;
}

const OPTIONS: Array<{ value: boolean; label: string }> = [
  { value: true, label: 'Vrai' },
  { value: false, label: 'Faux' },
];

export function QuestionFormFieldsTrueFalse({ form }: TrueFalseFieldsProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <FieldRoot
          control={form.control}
          name="correctAnswer"
          render={({ field }) => (
            <FieldGroup className="flex flex-col space-y-3">
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                Sélectionnez la bonne réponse
              </FieldLabel>
              <FieldContent>
                <div className="space-y-3">
                  {OPTIONS.map(({ value, label }) => {
                    const isSelected = field.value === value;
                    return (
                      <div
                        key={label}
                        onClick={() => form.setValue('correctAnswer', value)}
                        className={cn(
                          'group cursor-pointer rounded-sm border p-3 transition-all duration-200',
                          isSelected
                            ? 'border-(--color-primary) bg-primary/5 shadow-sm'
                            : 'border-border bg-card hover:border-primary/20 hover:bg-muted/30 hover:shadow-sm',
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                              isSelected
                                ? 'border-(--color-primary) bg-(--color-primary) text-primary-foreground'
                                : 'border-muted-foreground/30',
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-xs font-medium">{label}</span>
                        </div>
                      </div>
                    );
                  })}
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
