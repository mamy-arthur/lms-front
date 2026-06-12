"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "@/shared/constants/modules";
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import type { Tenant } from "@/shared/types/tenant.types";
import { useCreateModule } from "../../hooks/useCreateModule";
import { useUpdateModule } from "../../hooks/useUpdateModule";
import type { CreateModulePayload, Module, UpdateModulePayload } from "../../types";

const createSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
  courseIds: z.array(z.string()).min(0),
});

const updateSchema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  identifier: z.string().min(1, "Identifiant requis").max(60),
  description: z.string().max(2000).optional().or(z.literal("")),
  category: z.string().min(1, "Catégorie requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
  courseIds: z.array(z.string()).min(0),
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

const CREATE_DEFAULTS: CreateFormValues = {
  name: "",
  identifier: "",
  description: "",
  category: "",
  tenant_id: "",
  courseIds: [],
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
  module: mod,
  tenants,
}: AdminModuleFormDrawerProps) {
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);
  const isEdit = !!mod;

  const createMutation = useCreateModule();
  const updateMutation = useUpdateModule();

  const mutation = isEdit ? updateMutation : createMutation;

  const schema = isEdit ? updateSchema : createSchema;
  const defaultValues = useMemo(() => {
    if (mod) {
      return {
        name: mod.name,
        identifier: mod.identifier,
        description: mod.description,
        category: mod.category,
        tenant_id: mod.tenantId,
        courseIds: mod.courseIds,
      };
    }
    return CREATE_DEFAULTS;
  }, [mod]);

  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      const vals = mod
        ? {
            name: mod.name,
            identifier: mod.identifier,
            description: mod.description,
            category: mod.category,
            tenant_id: mod.tenantId,
            courseIds: mod.courseIds,
          }
        : CREATE_DEFAULTS;
      form.reset(vals);
    }
  }, [open, mod, form]);

  const handleClose = useCallback(() => {
    form.reset(CREATE_DEFAULTS);
    createMutation.reset();
    updateMutation.reset();
    onClose();
  }, [form, createMutation, updateMutation, onClose]);

  const selectedCourseIds = form.watch("courseIds");

  const toggleCourse = useCallback(
    (courseId: string) => {
      const current = form.getValues("courseIds");
      const next = current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId];
      form.setValue("courseIds", next, { shouldValidate: true });
    },
    [form],
  );

  const name = form.watch("name");

  const onSubmit = useCallback(
    (values: CreateFormValues | UpdateFormValues) => {
      if (isEdit && mod) {
        const data: UpdateModulePayload = {
          name: values.name,
          identifier: values.identifier,
          description: values.description ?? "",
          category: values.category,
          tenant_id: values.tenant_id,
          course_ids: values.courseIds,
        };
        updateMutation.mutate(
          { id: mod.id, data },
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
          {
            ...values,
            description: values.description ?? "",
            course_ids: values.courseIds,
          } as CreateModulePayload,
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
    [isEdit, mod, createMutation, updateMutation, form, onSuccess],
  );

  return (
    <Sheet open={open}>
      <SheetContent
        className="sm:max-w-lg"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Modifier le module" : "Ajouter un module"}
          </SheetTitle>
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
                name="name"
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
                name="identifier"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Identifiant</FieldLabel>
                    <FieldContent>
                      <div className="flex gap-2">
                        <Input
                          aria-label="Identifiant"
                          className="h-9 px-3 text-sm flex-1"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            form.setValue(
                              "identifier",
                              genIdentifier(name),
                              { shouldValidate: true },
                            )
                          }
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
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Catégorie</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FieldContent>
                        <SelectTrigger
                          size="default"
                          aria-label="Catégorie"
                          className="w-full"
                        >
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
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
                control={form.control}
                name="tenant_id"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Tenant</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
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

              <FieldRoot
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Description</FieldLabel>
                    <FieldContent>
                      <Textarea
                        aria-label="Description"
                        className="min-h-24 resize-y text-sm"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError />
                  </FieldGroup>
                )}
              />

              <FieldRoot
                control={form.control}
                name="courseIds"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel>Cours liés</FieldLabel>
                    <Popover
                      open={coursePopoverOpen}
                      onOpenChange={setCoursePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FieldContent>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-label="Cours liés"
                            className="w-full justify-between font-normal h-9"
                          >
                            {selectedCourseIds.length > 0
                              ? `${selectedCourseIds.length} cours sélectionné${selectedCourseIds.length > 1 ? "s" : ""}`
                              : "Sélectionner des cours…"}
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                          </Button>
                        </FieldContent>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[--radix-popover-trigger-width] p-0"
                        align="start"
                      >
                        <Command>
                          <CommandInput placeholder="Rechercher un cours…" />
                          <CommandList>
                            <CommandEmpty>
                              Aucun cours trouvé.
                            </CommandEmpty>
                            <CommandGroup>
                              {MOCK_COURSES.map((course) => (
                                <CommandItem
                                  key={course.id}
                                  value={course.fullName}
                                  onSelect={() => toggleCourse(course.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4",
                                      selectedCourseIds.includes(course.id)
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {course.fullName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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

export const AdminModuleFormDrawer = memo(AdminModuleFormDrawerBase);
