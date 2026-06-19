"use client";

import { memo, useCallback, useMemo } from "react";
import { z } from "zod";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/shared/constants/roles";
import {
  useUserFormDrawer,
} from "@modules/shared/components/users/use-user-form-drawer";
import { UserForm } from "@modules/shared/components/users/user-form";
import type { Tenant } from "@/shared/types/tenant.types";
import { useCreateUser } from "../../hooks/useCreateUser";
import { useUpdateUser } from "../../hooks/useUpdateUser";
import type { CreateUserPayload, User } from "../../types";

const createSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(120),
  last_name: z.string().min(1, "Nom requis").max(120),
  username: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(8, "Minimum 8 caractères").max(255),
  role: z.nativeEnum(Role),
  tenant_id: z.string().min(1, "Tenant requis"),
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
  role: z.nativeEnum(Role),
  tenant_id: z.string().min(1, "Tenant requis"),
  city: z.string().max(120).optional().or(z.literal("")),
  country: z.string().max(120).optional().or(z.literal("")),
});

const ROLE_LABELS: Record<string, string> = {
  [Role.SUPER_ADMIN]: "Super admin",
  [Role.EDITOR]: "Éditeur",
  [Role.CLIENT_MANAGER]: "Responsable",
  [Role.TRAINEE]: "Stagiaire",
};

const ROLE_DEFAULTS: z.infer<typeof createSchema> = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  role: Role.TRAINEE,
  tenant_id: "",
  city: "",
  country: "",
};

export interface AdminUserFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  user?: User;
  tenants: Tenant[];
}

function AdminUserFormDrawerBase({
  open,
  onClose,
  onSuccess,
  user,
  tenants,
}: AdminUserFormDrawerProps) {
  const isEdit = !!user;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const schema = isEdit ? updateSchema : createSchema;

  const buildDefaults = useCallback((u?: User) => {
    if (u) {
      return {
        first_name: u.first_name,
        last_name: u.last_name,
        username: u.username,
        email: u.email,
        password: "",
        role: u.role,
        tenant_id: u.tenantId,
        city: u.city,
        country: u.country,
      };
    }
    return ROLE_DEFAULTS;
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
    createDefaults: ROLE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password as string,
        role: values.role,
        tenant_id: values.tenant_id,
        city: values.city ?? "",
        country: values.country ?? "",
        ...(values.username ? { username: values.username } : {}),
      }) as CreateUserPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        role: values.role,
        tenant_id: values.tenant_id,
        city: values.city ?? "",
        country: values.country ?? "",
        ...(values.username ? { username: values.username } : {}),
        ...(values.password ? { password: values.password } : {}),
      } as Partial<CreateUserPayload>,
    }),
  });

  const tenantField = (
    <FieldRoot
      control={formState.form.control as any}
      name="tenant_id"
      render={({ field }) => (
        <FieldGroup>
          <FieldLabel>Tenant</FieldLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FieldContent>
              <SelectTrigger
                size="default"
                aria-label="Tenant"
                className="w-full"
              >
                <SelectValue placeholder="Sélectionner un tenant" />
              </SelectTrigger>
            </FieldContent>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError />
        </FieldGroup>
      )}
    />
  );

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
          extraFields={tenantField}
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminUserFormDrawer = memo(AdminUserFormDrawerBase);
