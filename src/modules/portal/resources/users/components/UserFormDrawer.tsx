"use client";

import { memo, useCallback, useEffect, useMemo } from "react";
import { z } from "zod";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  useUserFormDrawer,
} from "@modules/shared/components/users/use-user-form-drawer";
import { UserForm } from "@modules/shared/components/users/user-form";
import { useTenantStore } from "@/shared/stores/tenant.store";
import { useCreateTenantUser } from "../hooks/useCreateTenantUser";
import { useUpdateTenantUser } from "../hooks/useUpdateTenantUser";
import type {
  CreateTenantUserPayload,
  TenantUser,
  UpdateTenantUserPayload,
} from "../types";

const createSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(120),
  last_name: z.string().min(1, "Nom requis").max(120),
  username: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(8, "Minimum 8 caractères").max(255),
  role: z.enum(["CLIENT_MANAGER", "TRAINEE"]),
  city: z.string().max(120).optional().or(z.literal("")),
  country: z.string().max(120).optional().or(z.literal("")),
});

const updateSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(120),
  last_name: z.string().min(1, "Nom requis").max(120),
  username: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Email invalide").max(255),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .max(255)
    .optional()
    .or(z.literal("")),
  role: z.enum(["CLIENT_MANAGER", "TRAINEE"]),
  city: z.string().max(120).optional().or(z.literal("")),
  country: z.string().max(120).optional().or(z.literal("")),
});

const ROLE_LABELS: Record<string, string> = {
  CLIENT_MANAGER: "Responsable",
  TRAINEE: "Stagiaire",
};

const CREATE_DEFAULTS: z.infer<typeof createSchema> = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  role: "TRAINEE",
  city: "",
  country: "",
};

export interface UserFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: TenantUser;
}

function UserFormDrawerBase({
  open,
  onClose,
  onSuccess,
  user,
}: UserFormDrawerProps) {
  const isEdit = !!user;

  const createMutation = useCreateTenantUser();
  const updateMutation = useUpdateTenantUser();
  const tenantId = useTenantStore((s) => s.tenant?.id ?? null);

  const schema = isEdit ? updateSchema : createSchema;

  const buildDefaults = useCallback((u?: TenantUser) => {
    if (u) {
      return {
        first_name: u.first_name,
        last_name: u.last_name,
        username: u.username,
        email: u.email,
        password: "",
        role: u.role as "CLIENT_MANAGER" | "TRAINEE",
        city: u.city,
        country: u.country,
      };
    }
    return CREATE_DEFAULTS;
  }, []);

  const defaultValues = useMemo(() => buildDefaults(user), [user, buildDefaults]);

  const formState = useUserFormDrawer({
    open,
    onClose,
    onSuccess,
    user,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password as string,
        role: values.role as CreateTenantUserPayload["role"],
        city: values.city ?? "",
        country: values.country ?? "",
        tenant_id: tenantId,
        ...(values.username ? { username: values.username } : {}),
      }) as CreateTenantUserPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role as UpdateTenantUserPayload["role"],
        city: values.city ?? "",
        country: values.country ?? "",
        ...(values.username ? { username: values.username } : {}),
        ...(values.password ? { password: values.password } : {}),
      } as UpdateTenantUserPayload,
    }),
  });

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{isEdit ? "Modifier l'utilisateur" : "Créer un utilisateur"}</SheetTitle>
          <SheetDescription>
            Renseignez les informations de l'utilisateur.
          </SheetDescription>
        </SheetHeader>
        <UserForm
          form={formState.form}
          mutation={formState.mutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={formState.onSubmit}
          showPassword={formState.showPassword}
          togglePasswordVisibility={formState.togglePasswordVisibility}
          roleLabels={ROLE_LABELS}
          lastLogin={user?.lastLogin}
        />
      </SheetContent>
    </Sheet>
  );
}

export const UserFormDrawer = memo(UserFormDrawerBase);
