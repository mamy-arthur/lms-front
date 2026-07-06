/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { z } from 'zod';
import type { MutationLike } from '@/shared/types/mutation';
import { useFormDrawer as _useFormDrawer } from '@/shared/components/form-drawer/use-form-drawer';

export type { MutationLike };

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

  const base = _useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: user,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults,
    buildCreatePayload,
    buildUpdatePayload,
  });

  const togglePasswordVisibility = useCallback(() => setShowPassword((v) => !v), []);

  return {
    ...base,
    showPassword,
    togglePasswordVisibility,
  };
}
