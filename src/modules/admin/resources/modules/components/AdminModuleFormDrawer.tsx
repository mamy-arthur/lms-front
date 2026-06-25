"use client";

import { memo, useCallback, useEffect, useMemo } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CATEGORY_OPTIONS } from "@modules/shared/components/modules/constants/modules";
import { useFormDrawer } from "@/shared/components/form-drawer/use-form-drawer";
import { extractApiError } from "@/shared/utils/api-error";
import { useCreateModule } from "../hooks/useCreateModule";
import { useUpdateModule } from "../hooks/useUpdateModule";
import type { CreateModulePayload, Module, UpdateModulePayload } from "../types";
import type { Tenant } from "@/shared/types/tenant.types";

function genIdentifier(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 20);
  const rand = Math.floor(100 + Math.random() * 900);
  return slug ? `${slug}-${rand}` : `MOD-${rand}`;
}

const createSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
  course_ids: z.array(z.string()),
});

const updateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
  course_ids: z.array(z.string()),
});

type CreateFormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: CreateFormValues = {
  name: "",
  identifier: "",
  description: "",
  category: "",
  tenant_id: "",
  course_ids: [],
};

export interface AdminModuleFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  module?: Module;
  tenants: Tenant[];
}

function AdminModuleFormDrawerBase({
  open,
  onClose,
  onSuccess,
  module,
  tenants,
}: AdminModuleFormDrawerProps) {
  const isEdit = !!module;

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();

  const schema = isEdit ? updateSchema : createSchema;

  const defaultValues = useMemo(() => {
    if (module) {
      return {
        name: module.name,
        identifier: module.identifier,
        description: module.description,
        category: module.category,
        tenant_id: module.tenantId,
        course_ids: module.courseIds,
      };
    }
    return CREATE_DEFAULTS;
  }, [module]);

  const formState = useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: module,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        name: values.name,
        identifier: values.identifier,
        description: values.description ?? "",
        category: values.category,
        tenant_id: values.tenant_id,
        course_ids: values.course_ids,
      }) as CreateModulePayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        name: values.name,
        identifier: values.identifier,
        description: values.description ?? "",
        category: values.category,
        tenant_id: values.tenant_id,
        course_ids: values.course_ids,
      } as UpdateModulePayload,
    }),
  });

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  const handleAutoIdentifier = useCallback(() => {
    const name = formState.form.getValues("name") as string;
    if (name) {
      formState.form.setValue("identifier", genIdentifier(name), {
        shouldValidate: true,
      });
    }
  }, [formState.form]);

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && formState.handleClose()}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl lg:max-w-4xl"
        showCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{isEdit ? "Modifier le module" : "Ajouter un module"}</SheetTitle>
          <SheetDescription>
            Renseignez les informations pour le module.
          </SheetDescription>
        </SheetHeader>
        <Field {...formState.form}>
          <form
            onSubmit={formState.form.handleSubmit(formState.onSubmit)}
            className="flex flex-1 flex-col"
            noValidate
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
              {formState.mutation.isError && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {extractApiError(formState.mutation.error, isEdit)}
                </div>
              )}

              <FieldRoot
                control={formState.form.control as any}
                name="category"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Catégorie</FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FieldContent>
                        <SelectTrigger aria-label="Catégorie" className="w-full text-xs">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={formState.form.control as any}
                name="tenant_id"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Tenant</FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FieldContent>
                        <SelectTrigger aria-label="Tenant" className="w-full text-xs">
                          <SelectValue placeholder="Sélectionner un tenant" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={formState.form.control as any}
                name="name"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Nom</FieldLabel>
                    <FieldContent>
                      <Input
                        autoFocus
                        aria-label="Nom"
                        className="text-xs"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={formState.form.control as any}
                name="identifier"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Identifiant</FieldLabel>
                    <FieldContent>
                      <div className="flex gap-2">
                        <Input
                          aria-label="Identifiant"
                          className="text-xs"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleAutoIdentifier}
                        >
                          Auto
                        </Button>
                      </div>
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={formState.form.control as any}
                name="description"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Description</FieldLabel>
                    <FieldContent>
                      <Textarea
                        aria-label="Description"
                        className="min-h-24 resize-y text-xs"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-background px-6 py-4 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={formState.handleClose}
                disabled={formState.mutation.isPending}
                size="lg"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={formState.mutation.isPending}
                size="lg"
                className="bg-(--color-primary) hover:bg-(--color-primary)/80"
              >
                {formState.mutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {formState.mutation.isPending
                  ? isEdit ? "Enregistrement…" : "Création…"
                  : isEdit ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </form>
        </Field>
      </SheetContent>
    </Sheet>
  );
}

export const AdminModuleFormDrawer = memo(AdminModuleFormDrawerBase);
