"use client";

import { memo, useMemo } from "react";
import { z } from "zod";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCreateQuiz } from "../hooks/useCreateQuiz";
import { useUpdateQuiz } from "../hooks/useUpdateQuiz";
import type {
  CreateQuizPayload,
  Quiz,
  UpdateQuizPayload,
} from "../types";
import { QuizForm } from "./quiz-form";
import { genQuizId } from "./quiz-form-utils";
import { useQuizFormDrawer } from "./use-quiz-form-drawer";

const createSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  slug: z.string().min(1, "Slug requis").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  isFinalEvaluation: z.boolean(),
  formationId: z.string().min(1, "Formation requise"),
});

const updateSchema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  slug: z.string().min(1, "Slug requis").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  isFinalEvaluation: z.boolean(),
  formationId: z.string().min(1, "Formation requise"),
});

type CreateFormValues = z.infer<typeof createSchema>;

const CREATE_DEFAULTS: CreateFormValues = {
  title: "",
  slug: "",
  description: "",
  isFinalEvaluation: false,
  formationId: "",
};

export interface QuizFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  quiz?: Quiz;
}

function QuizFormDrawerBase({
  open,
  onClose,
  onSuccess,
  quiz: mod,
}: QuizFormDrawerProps) {
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
        tenant_id: "",
      }) as CreateQuizPayload,
    buildUpdatePayload: (values, id) => ({
      id,
      data: {
        title: values.title,
        slug: values.slug,
        description: values.description ?? "",
        is_final_evaluation: values.isFinalEvaluation,
        formation_id: values.formationId,
        tenant_id: "",
      } as UpdateQuizPayload,
    }),
  });

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
        />
      </SheetContent>
    </Sheet>
  );
}

export const QuizFormDrawer = memo(QuizFormDrawerBase);
