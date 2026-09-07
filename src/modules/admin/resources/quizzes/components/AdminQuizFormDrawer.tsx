'use client';

import { memo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { extractApiError } from '@/shared/utils/api-error';
import { useCreateQuiz } from '../hooks/useCreateQuiz';
import { useUpdateQuiz } from '../hooks/useUpdateQuiz';
import type { Quiz } from '../types';
import { quizSchema, type QuizFormValues } from '../validation';

export interface AdminQuizFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  quiz?: Quiz;
  duplicateFrom?: Quiz;
}

function AdminQuizFormDrawerBase({
  open,
  onClose,
  onSuccess,
  quiz,
  duplicateFrom,
}: AdminQuizFormDrawerProps) {
  const isEdit = !!quiz;
  const isDuplicate = !!duplicateFrom;
  const source = quiz ?? duplicateFrom;

  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();
  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: { title: '', description: null },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: source?.title ?? '',
        description: source?.description ?? null,
      });
    }
  }, [open, source, form]);

  const onSubmit = async (values: QuizFormValues) => {
    try {
      if (isEdit && quiz) {
        await updateMutation.mutateAsync({
          id: quiz.id,
          data: { title: values.title, description: values.description ?? null },
        });
      } else {
        await createMutation.mutateAsync({
          title: values.title,
          description: values.description ?? null,
        });
      }
      onSuccess?.();
      onClose();
    } catch {
      // handled by mutation onError toast
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-lg" showCloseButton>
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            {isEdit
              ? 'Modifier la banque'
              : isDuplicate
                ? 'Dupliquer la banque'
                : 'Nouvelle banque de questions'}
          </SheetTitle>
          <SheetDescription>Renseignez le titre et la description de la banque.</SheetDescription>
        </SheetHeader>

        <Field {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
              {mutation.isError && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {extractApiError(mutation.error, isEdit)}
                </div>
              )}

              <FieldRoot
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FieldGroup className="space-y-2">
                    <FieldLabel className="text-xs">Titre *</FieldLabel>
                    <FieldContent>
                      <Input
                        autoFocus
                        aria-label="Titre"
                        placeholder="Ex. : Banque — Sécurité informatique"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FieldGroup className="space-y-2">
                    <FieldLabel className="text-xs">Description</FieldLabel>
                    <FieldContent>
                      <Textarea
                        aria-label="Description"
                        placeholder="Description optionnelle…"
                        className="min-h-24 resize-y"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-(--color-primary) hover:bg-(--color-primary)/80"
              >
                {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Field>
      </SheetContent>
    </Sheet>
  );
}

export const AdminQuizFormDrawer = memo(AdminQuizFormDrawerBase);
