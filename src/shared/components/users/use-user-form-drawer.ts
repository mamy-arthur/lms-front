import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues } from "react-hook-form";
import type { z } from "zod";

export interface MutationLike {
  mutate: (...args: any[]) => void;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  reset: () => void;
}

export function useUserFormDrawer({
  open,
  onClose,
  onSuccess,
  user,
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
  user?: { id: string; lastLogin?: string };
  createMutation: MutationLike;
  updateMutation: MutationLike;
  schema: z.ZodSchema<any>;
  defaultValues: FieldValues;
  createDefaults: FieldValues;
  buildCreatePayload: (values: FieldValues) => unknown;
  buildUpdatePayload: (values: FieldValues, id: string) => unknown;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = !!user;

  const mutation = isEdit ? updateMutation : createMutation;

  const form = useForm({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open, defaultValues, form]);

  const handleClose = useCallback(() => {
    form.reset(createDefaults);
    createMutation.reset();
    updateMutation.reset();
    onClose();
  }, [form, createMutation, updateMutation, onClose, createDefaults]);

  const togglePasswordVisibility = useCallback(
    () => setShowPassword((v) => !v),
    [],
  );

  const onSubmit = useCallback(
    (values: FieldValues) => {
      if (isEdit && user) {
        updateMutation.mutate(
          buildUpdatePayload(values, user.id),
          {
            onSuccess: () => {
              form.reset();
              createMutation.reset();
              updateMutation.reset();
              onSuccess?.();
            },
          },
        );
      } else {
        createMutation.mutate(
          buildCreatePayload(values),
          {
            onSuccess: () => {
              form.reset();
              createMutation.reset();
              updateMutation.reset();
              onSuccess?.();
            },
          },
        );
      }
    },
    [isEdit, user, createMutation, updateMutation, form, onSuccess, buildCreatePayload, buildUpdatePayload],
  );

  return {
    form,
    handleClose,
    onSubmit,
    mutation,
    isEdit,
    showPassword,
    togglePasswordVisibility,
  };
}
