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
import { Switch } from "@/components/ui/switch";
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
import { MOCK_COURSES } from "@/shared/mocks/courses.mock";
import { useFormDrawer } from "@/shared/components/form-drawer/use-form-drawer";
import { extractApiError } from "@/shared/utils/api-error";
import { useCreateQuiz } from "../hooks/useCreateQuiz";
import { useUpdateQuiz } from "../hooks/useUpdateQuiz";
import type { CreateQuizPayload, Quiz, UpdateQuizPayload } from "../types";
import type { Tenant } from "@/shared/types/tenant.types";

function genQuizId(title: string) {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 30);
  const rand = Math.floor(100 + Math.random() * 900);
  return slug ? `${slug}-${rand}` : `quiz-${rand}`;
}

const createSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  slug: z.string().min(1, "Slug requis").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  isFinalEvaluation: z.boolean(),
  formationId: z.string().min(1, "Formation requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
});

const updateSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  slug: z.string().min(1, "Slug requis").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  isFinalEvaluation: z.boolean(),
  formationId: z.string().min(1, "Formation requise"),
  tenant_id: z.string().min(1, "Tenant requis"),
});

type CreateFormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: CreateFormValues = {
  title: "",
  slug: "",
  description: "",
  isFinalEvaluation: false,
  formationId: "",
  tenant_id: "",
};

export interface AdminQuizFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  quiz?: Quiz;
  tenants: Tenant[];
}

function AdminQuizFormDrawerBase({
  open,
  onClose,
  onSuccess,
  quiz,
  tenants,
}: AdminQuizFormDrawerProps) {
  const isEdit = !!quiz;

  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();

  const schema = isEdit ? updateSchema : createSchema;

  const defaultValues = useMemo(() => {
    if (quiz) {
      return {
        title: quiz.title,
        slug: quiz.slug,
        description: quiz.description,
        isFinalEvaluation: quiz.isFinalEvaluation,
        formationId: quiz.formationId,
        tenant_id: quiz.tenantId,
      };
    }
    return CREATE_DEFAULTS;
  }, [quiz]);

  const formState = useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: quiz,
    createMutation,
    updateMutation,
    schema,
    defaultValues,
    createDefaults: CREATE_DEFAULTS,
    buildCreatePayload: (values) =>
      ({
        title: values.title,
        slug: values.slug,
        description: values.description ?? "",
        is_final_evaluation: values.isFinalEvaluation,
        formation_id: values.formationId,
        tenant_id: values.tenant_id,
      }) as CreateQuizPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        title: values.title,
        slug: values.slug,
        description: values.description ?? "",
        is_final_evaluation: values.isFinalEvaluation,
        formation_id: values.formationId,
        tenant_id: values.tenant_id,
      } as UpdateQuizPayload,
    }),
  });

  useEffect(() => {
    if (open) {
      formState.form.reset(defaultValues);
    }
  }, [open, defaultValues, formState.form]);

  const handleAutoSlug = useCallback(() => {
    const title = formState.form.getValues("title") as string;
    if (title) {
      formState.form.setValue("slug", genQuizId(title), {
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
          <SheetTitle>{isEdit ? "Modifier le quiz" : "Ajouter un quiz"}</SheetTitle>
          <SheetDescription>
            Renseignez les informations pour le quiz.
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
                name="formationId"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Formation</FieldLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FieldContent>
                        <SelectTrigger aria-label="Formation" className="w-full text-xs">
                          <SelectValue placeholder="Sélectionner une formation" />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        {MOCK_COURSES.map((course) => (
                          <SelectItem key={course.id} value={course.id} className="text-xs">
                            {course.fullName}
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
                name="title"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Titre</FieldLabel>
                    <FieldContent>
                      <Input
                        autoFocus
                        aria-label="Titre"
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
                name="slug"
                render={({ field }) => (
                  <FieldGroup>
                    <FieldLabel className="text-xs">Slug</FieldLabel>
                    <FieldContent>
                      <div className="flex gap-2">
                        <Input
                          aria-label="Slug"
                          className="text-xs"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={handleAutoSlug}
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

              <FieldRoot
                control={formState.form.control as any}
                name="isFinalEvaluation"
                render={({ field }) => (
                  <FieldGroup>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        size="sm"
                        className="data-[state=checked]:bg-(--color-primary)"
                      />
                      <FieldLabel className="text-xs mb-0">
                        Évaluation finale
                      </FieldLabel>
                    </div>
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

export const AdminQuizFormDrawer = memo(AdminQuizFormDrawerBase);
