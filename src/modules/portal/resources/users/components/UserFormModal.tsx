"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { memo, useCallback, useState } from "react";
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
} from "@/components/ui/sheet";
import { useTenantStore } from "@/shared/stores/tenant.store";
import { useCreateTenantUser } from "../hooks/useCreateTenantUser";
import type { CreateTenantUserPayload } from "../types";

// ─── Schema ──────────────────────────────────────────────────────────────────

const createTenantUserSchema = z.object({
  first_name: z.string().min(1, "Prénom requis").max(120),
  last_name: z.string().min(1, "Nom requis").max(120),
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(8, "Minimum 8 caractères").max(255),
  role: z.enum(["CLIENT_MANAGER", "TRAINEE"]),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof createTenantUserSchema>;

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<"CLIENT_MANAGER" | "TRAINEE", string> = {
  CLIENT_MANAGER: "Responsable",
  TRAINEE: "Stagiaire",
};

const DEFAULT_VALUES: FormValues = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "TRAINEE",
  is_active: true,
};

// ─── Error extraction (pure function) ────────────────────────────────────────

function extractApiError(err: unknown): string {
  if (err && typeof err === "object") {
    const maybeJson = (err as Record<string, unknown>).json;
    if (maybeJson && typeof maybeJson === "object") {
      const msg = (maybeJson as Record<string, unknown>).message;
      if (typeof msg === "string" && msg.length > 0) return msg;
    }
  }
  return "Une erreur est survenue lors de la création.";
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

function UserFormModalBase({ open, onClose, onSuccess }: UserFormModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    mutate,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useCreateTenantUser();
  const tenantId = useTenantStore((s) => s.tenant?.id ?? null);

  const form = useForm<FormValues>({
    resolver: zodResolver(createTenantUserSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleClose = useCallback(() => {
    form.reset();
    resetMutation();
    onClose();
  }, [form, resetMutation, onClose]);

  const togglePasswordVisibility = useCallback(
    () => setShowPassword((v) => !v),
    [],
  );

  const onSubmit = useCallback(
    (values: FormValues) => {
      mutate({ ...values, tenant_id: tenantId } as CreateTenantUserPayload, {
        onSuccess: () => {
          form.reset();
          resetMutation();
          onSuccess?.();
        },
      });
    },
    [mutate, tenantId, form, resetMutation, onSuccess],
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
          <SheetTitle>Créer un utilisateur</SheetTitle>
        </SheetHeader>


        <Field {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col"
            noValidate
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
              {isError && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {extractApiError(error)}
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
                          aria-label="Rôle"
                          className="h-9 px-3 text-sm"
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
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                size="lg"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending} size="lg">
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Création…" : "Créer"}
              </Button>
            </div>
          </form>
        </Field>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Mémoïsé : le Sheet ne se re-rend pas quand le parent change
 * (ex. search input), sauf si ses props changent.
 */
export const UserFormModal = memo(UserFormModalBase);
