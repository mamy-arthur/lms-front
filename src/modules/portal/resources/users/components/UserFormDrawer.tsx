"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

function extractApiError(err: unknown, isEdit: boolean): string {
  if (err && typeof err === "object") {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === "object") {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  }
  return isEdit
    ? "Une erreur est survenue lors de la modification."
    : "Une erreur est survenue lors de la création.";
}

const ROLE_LABELS: Record<"CLIENT_MANAGER" | "TRAINEE", string> = {
  CLIENT_MANAGER: "Responsable",
  TRAINEE: "Stagiaire",
};

const CREATE_DEFAULTS: CreateFormValues = {
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
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = !!user;

  const createMutation = useCreateTenantUser();
  const updateMutation = useUpdateTenantUser();

  const mutation = isEdit ? updateMutation : createMutation;
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

  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) form.reset(buildDefaults(user));
  }, [open, user, form, buildDefaults]);

  const handleClose = useCallback(() => {
    form.reset(CREATE_DEFAULTS);
    createMutation.reset();
    updateMutation.reset();
    onClose();
  }, [form, createMutation, updateMutation, onClose]);

  const togglePasswordVisibility = useCallback(
    () => setShowPassword((v) => !v),
    [],
  );

  const onSubmit = useCallback(
    (values: CreateFormValues | UpdateFormValues) => {
      if (isEdit && user) {
        const data: UpdateTenantUserPayload = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role as UpdateTenantUserPayload["role"],
          city: values.city ?? "",
          country: values.country ?? "",
        };
        if (values.username) data.username = values.username;
        if (values.password) data.password = values.password;
        updateMutation.mutate(
          { id: user.id, data },
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
        const payload: CreateTenantUserPayload = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          password: values.password as string,
          role: values.role as CreateTenantUserPayload["role"],
          city: values.city ?? "",
          country: values.country ?? "",
          tenant_id: tenantId,
        };
        if (values.username) payload.username = values.username;
        createMutation.mutate(payload, {
          onSuccess: () => {
            form.reset();
            createMutation.reset();
            updateMutation.reset();
            onSuccess?.();
          },
        });
      }
    },
    [isEdit, user, tenantId, createMutation, updateMutation, form, onSuccess],
  );

  return (
    <Sheet open={open}>
      <SheetContent
        className="sm:max-w-lg"
        showCloseButton={false}
        data-testid="user-form"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Modifier l'utilisateur" : "Créer un utilisateur"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {isEdit ? "Formulaire de modification d'utilisateur" : "Formulaire de création d'utilisateur"}
          </SheetDescription>
        </SheetHeader>

        <Field {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col"
            noValidate
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
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
                name="last_name"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Nom</FieldLabel>
                    <FieldContent>
                      <Input
                        autoFocus
                        aria-label="Nom"
                        className="h-9 px-3 text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
              <FieldRoot
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Prénom</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-label="Prénom"
                        className="h-9 px-3 text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Nom d'utilisateur</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-label="Nom d'utilisateur"
                        className="h-9 px-3 text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Email</FieldLabel>
                    <FieldContent>
                      <Input
                        type="email"
                        aria-label="Email"
                        className="h-9 px-3 text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Rôle</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FieldContent>
                        <SelectTrigger
                          size="default"
                          aria-label="Rôle"
                          className="w-full"
                        >
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Ville</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-label="Ville"
                        className="h-9 px-3 text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Pays</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-label="Pays"
                        className="h-9 px-3 text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              {isEdit && user?.lastLogin && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Dernière connexion
                  </span>
                  <span className="text-sm text-foreground">
                    {new Date(user.lastLogin).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              <FieldRoot
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Mot de passe</FieldLabel>
                    <FieldContent>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          aria-label="Mot de passe"
                          className="h-9 px-3 pr-10 text-sm"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={
                            showPassword
                              ? "Masquer le mot de passe"
                              : "Afficher le mot de passe"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
                size="lg"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending} size="lg">
                {mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {mutation.isPending
                  ? isEdit
                    ? "Enregistrement…"
                    : "Création…"
                  : isEdit
                    ? "Enregistrer"
                    : "Créer"}
              </Button>
            </div>
          </form>
        </Field>
      </SheetContent>
    </Sheet>
  );
}

export const UserFormDrawer = memo(UserFormDrawerBase);
