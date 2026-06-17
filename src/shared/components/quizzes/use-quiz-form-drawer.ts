"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";

export interface MutationLike {
  mutate: (...args: any[]) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}

export interface QuizFormQuiz {
  id: string;
  title: string;
  slug: string;
  description: string;
  isFinalEvaluation: boolean;
  formationId: string;
}

export function useQuizFormDrawer({
  open,
  onClose,
  onSuccess,
  quiz,
  createMutation,
  updateMutation,
  schema,
  defaultValues,
  createDefaults,
  buildCreatePayload,
  buildUpdatePayload,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  quiz?: QuizFormQuiz;
  createMutation: MutationLike;
  updateMutation: MutationLike;
  schema: z.ZodSchema<any>;
  defaultValues: FieldValues;
  createDefaults: FieldValues;
  buildCreatePayload: (values: FieldValues) => unknown;
  buildUpdatePayload: (values: FieldValues, id: string) => unknown;
}) {
  const isEdit = !!quiz;

  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const handleClose = useCallback(() => {
    form.reset(createDefaults);
    createMutation.reset();
    updateMutation.reset();
    onClose();
  }, [form, createMutation, updateMutation, onClose, createDefaults]);

  const title = form.watch("title") as unknown as string;

  const formationOptions = useMemo(() => MOCK_COURSES, []);

  const onSubmit = useCallback(
    (values: FieldValues) => {
      if (isEdit && quiz) {
        updateMutation.mutate(buildUpdatePayload(values, quiz.id), {
          onSuccess: () => {
            form.reset();
            createMutation.reset();
            updateMutation.reset();
            onSuccess?.();
          },
        });
      } else {
        createMutation.mutate(buildCreatePayload(values), {
          onSuccess: () => {
            form.reset();
            createMutation.reset();
            updateMutation.reset();
            onSuccess?.();
          },
        });
      }
    },
    [
      isEdit,
      quiz,
      createMutation,
      updateMutation,
      form,
      onSuccess,
      buildCreatePayload,
      buildUpdatePayload,
    ],
  );

  return {
    form,
    handleClose,
    onSubmit,
    mutation,
    isEdit,
    title,
    formationOptions,
  };
}
