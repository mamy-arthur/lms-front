/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ModuleCategory, ModuleCategoryInput } from '../lib/module-store';
import { useModuleCategoryStore } from '../lib/module-store';

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ModuleCategoryFormProps {
  category?: ModuleCategory | null;
  onDone: () => void;
}

export function ModuleCategoryForm({ category, onDone }: ModuleCategoryFormProps) {
  const { addCategory, updateCategory } = useModuleCategoryStore();
  const isEdit = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
  });

  const onSubmit = useCallback(
    (values: FormValues) => {
      const input: ModuleCategoryInput = {
        name: values.name,
        identifier: values.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, '-')
          .toLowerCase()
          .replace(/^-|-$/g, ''),
        description: values.description ?? '',
        visible: true,
      };
      if (isEdit && category) {
        updateCategory(category.id, input);
      } else {
        addCategory(input);
      }
      onDone();
    },
    [isEdit, category, addCategory, updateCategory, onDone],
  );

  return (
    <Field {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-4 p-4"
        noValidate
      >
        <FieldRoot
          control={form.control as any}
          name="name"
          render={({ field }) => (
            <FieldGroup>
              <FieldLabel className="text-xs">Nom</FieldLabel>
              <FieldContent>
                <Input autoFocus aria-label="Nom" className="text-xs" {...field} />
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />

        <FieldRoot
          control={form.control as any}
          name="description"
          render={({ field }) => (
            <FieldGroup>
              <FieldLabel className="text-xs">Description</FieldLabel>
              <FieldContent>
                <Textarea
                  aria-label="Description"
                  className="min-h-20 resize-y text-xs"
                  {...field}
                />
              </FieldContent>
              <FieldError />
            </FieldGroup>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onDone}>
            Annuler
          </Button>
          <Button type="submit" size="sm">
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </form>
    </Field>
  );
}
