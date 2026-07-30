'use client';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FieldContent, FieldError, FieldGroup, FieldLabel, FieldRoot } from '@/components/ui/field';
import type { FormValues } from './question-form-data';
import { cn } from '@/lib/utils';

interface TrueFalseFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionFormFieldsTrueFalse({ form }: TrueFalseFieldsProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <FieldRoot
          control={form.control}
          name="correctAnswer"
          render={({ field }) => (
            <FieldGroup className="flex flex-col space-y-1">
              <FieldLabel className="text-xs">Réponse pour cette question</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('correctAnswer', true)}
                    className={cn(
                      'h-10 transition-colors',
                      field.value === true &&
                        'border-(--color-primary) bg-(--color-primary) text-white hover:bg-(--color-primary)/90 hover:border-(--color-primary)',
                    )}
                  >
                    Vrai
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('correctAnswer', false)}
                    className={cn(
                      'h-10 transition-colors',
                      field.value === false &&
                        'border-(--color-primary) bg-(--color-primary) text-white hover:bg-(--color-primary)/90 hover:border-(--color-primary)',
                    )}
                  >
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
