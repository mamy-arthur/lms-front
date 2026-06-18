"use client";

import { useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import type { z } from "zod";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import type { MutationLike } from "@/shared/types/mutation";
import { useFormDrawer as _useFormDrawer } from "@/shared/components/form-drawer/use-form-drawer";

export type { MutationLike };

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
  const base = _useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: quiz,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults,
    buildCreatePayload,
    buildUpdatePayload,
  });

  const title = base.form.watch("title") as unknown as string;

  const formationOptions = useMemo(() => MOCK_COURSES, []);

  return {
    ...base,
    title,
    formationOptions,
  };
}
