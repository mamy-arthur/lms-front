'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect } from 'react';
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
import type {
  CompetencyCategory,
  CreateCompetencyCategoryPayload,
  UpdateCompetencyCategoryPayload,
} from '../../types';
import { useCreateCompetencyCategory } from '../../hooks/useCreateCompetencyCategory';
import { useUpdateCompetencyCategory } from '../../hooks/useUpdateCompetencyCategory';
import { extractApiError } from '@/shared/utils/api-error';
import { generateIdnumberFromName } from './category-idnumber';

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface CompetencyCategoryFormProps {
  category?: CompetencyCategory | null;
  onDone: (created?: CompetencyCategory) => void;
  onCancel: () => void;
}

export function CompetencyCategoryForm({
  category,
  onDone,
  onCancel,
}: CompetencyCategoryFormProps) {
  const isEdit = !!category;
  const createMutation = useCreateCompetencyCategory();
  const updateMutation = useUpdateCompetencyCategory();
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      name: category?.name ?? '',
      description: category?.description ?? '',
    });
  }, [category, form]);

  const onSubmit = useCallback(
    (values: FormValues) => {
      if (isEdit && category) {
        const payload: UpdateCompetencyCategoryPayload = {
          name: values.name,
          description: values.description ?? '',
          visible: category.visible,
        };
        updateMutation.mutate({ id: category.id, data: payload }, { onSuccess: () => onDone() });
        return;
      }

      const payload: CreateCompetencyCategoryPayload = {
        name: values.name,
        idnumber: generateIdnumberFromName(values.name),
        description: values.description ?? '',
        visible: true,
      };

      createMutation.mutate(payload, {
        onSuccess: (created) => onDone(created),
      });
    },
    [isEdit, category, createMutation, updateMutation, onDone],
  );

  return (
    <Field {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-4"
        noValidate
      >
        {mutation.isError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {extractApiError(mutation.error, isEdit)}
          </div>
        )}

        <FieldRoot
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={mutation.isPending}
            className="bg-(--color-primary) hover:bg-(--color-primary)/80"
          >
            {mutation.isPending
              ? isEdit
                ? 'Enregistrement…'
                : 'Création…'
              : isEdit
                ? 'Enregistrer'
                : 'Créer'}
          </Button>
        </div>
      </form>
    </Field>
  );
}
