"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues } from "react-hook-form";
import type { z } from "zod";
import type { MutationLike } from "@/shared/types/mutation";

export interface UseFormDrawerOptions {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  entity?: { id: string };
  createMutation: MutationLike;
  updateMutation: MutationLike;
  schema: z.ZodSchema<any>;
  defaultValues: FieldValues;
  createDefaults: FieldValues;
  buildCreatePayload: (values: FieldValues) => unknown;
  buildUpdatePayload: (values: FieldValues, id: string) => unknown;
}

export function useFormDrawer({
  open,
  onClose,
  onSuccess,
  entity,
  createMutation,
  updateMutation,
  schema,
  defaultValues,
  createDefaults,
  buildCreatePayload,
  buildUpdatePayload,
}: UseFormDrawerOptions) {
  const isEdit = !!entity;

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

  const onSubmit = useCallback(
    (values: FieldValues) => {
      if (isEdit && entity) {
        updateMutation.mutate(buildUpdatePayload(values, entity.id), {
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
      entity,
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
  };
}
