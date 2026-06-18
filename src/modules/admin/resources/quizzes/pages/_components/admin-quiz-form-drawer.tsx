"use client";

import { memo, useMemo } from "react";
import { z } from "zod";
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QuizForm } from "@modules/shared/components/quizzes/quiz-form";
import {
  extractApiError,
  genQuizId,
} from "@modules/shared/components/quizzes/quiz-form-utils";
import { useQuizFormDrawer } from "@modules/shared/components/quizzes/use-quiz-form-drawer";
import type { Tenant } from "@/shared/types/tenant.types";
import { useCreateQuiz } from "../../hooks/useCreateQuiz";
import { useUpdateQuiz } from "../../hooks/useUpdateQuiz";
import type { CreateQuizPayload, Quiz, UpdateQuizPayload } from "../../types";

const createSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  slug: z.string().min(1, "Slug requis").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  isFinalEvaluation: z.boolean(),
  formationId: z.string().min(1, "Formation requise"),
  tenantId: z.string().min(1, "Tenant requis"),
});

const updateSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  slug: z.string().min(1, "Slug requis").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  isFinalEvaluation: z.boolean(),
  formationId: z.string().min(1, "Formation requise"),
  tenantId: z.string().min(1, "Tenant requis"),
});

type CreateFormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: CreateFormValues = {
  title: "",
  slug: "",
  description: "",
  isFinalEvaluation: false,
  formationId: "",
  tenantId: "",
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
  quiz: mod,
  tenants,
}: AdminQuizFormDrawerProps) {
  const isEdit = !!mod;

  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();

  const schema = isEdit ? updateSchema : createSchema;

  const defaultValues = useMemo(() => {
    if (mod) {
      return {
        title: mod.title,
        slug: mod.slug,
        description: mod.description,
        isFinalEvaluation: mod.isFinalEvaluation,
        formationId: mod.formationId,
        tenantId: mod.tenantId,
      };
    }
    return CREATE_DEFAULTS;
  }, [mod]);

  const formState = useQuizFormDrawer({
    open,
    onClose,
    onSuccess,
    quiz: mod,
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
        tenant_id: values.tenantId,
      }) as CreateQuizPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        title: values.title,
        slug: values.slug,
        description: values.description ?? "",
        is_final_evaluation: values.isFinalEvaluation,
        formation_id: values.formationId,
        tenant_id: values.tenantId,
      } as UpdateQuizPayload,
    }),
  });

  const tenantField = (
    <FieldRoot
      control={formState.form.control as any}
      name="tenantId"
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
          <SheetTitle>{isEdit ? "Modifier le quiz" : "Ajouter un quiz"}</SheetTitle>
          <SheetDescription>
            Renseignez les informations pour le quiz.
          </SheetDescription>
        </SheetHeader>
        <QuizForm
          form={formState.form}
          mutation={formState.mutation}
          isEdit={formState.isEdit}
          handleClose={formState.handleClose}
          onSubmit={formState.onSubmit}
          genSlugFn={genQuizId}
          extraFields={tenantField}
        />
      </SheetContent>
    </Sheet>
  );
}

export const AdminQuizFormDrawer = memo(AdminQuizFormDrawerBase);
