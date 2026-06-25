"use client";

import { QUESTION_TYPE_OPTIONS } from "@modules/shared/components/questions";
import { ArrowLeft, Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";

import { useFormDrawer } from "@/shared/components/form-drawer/use-form-drawer";
import { extractApiError } from "@/shared/utils/api-error";

import { useCreateQuestion } from "../hooks/useCreateQuestion";
import { useUpdateQuestion } from "../hooks/useUpdateQuestion";
import type { Question } from "../types";
import { QuestionFormFieldsChoices } from "./question-form-fields-choices";
import { QuestionFormFieldsCommon } from "./question-form-fields-common";
import { QuestionFormFieldsMatching } from "./question-form-fields-matching";
import { QuestionFormFieldsTrueFalse } from "./question-form-fields-true-false";
import { buildQuestionPayload, formSchema, FormValues, getCreateDefaults } from "./question-form-data";
import { TYPE_ICONS } from "./question-form-constants";
import { QuestionFormTypeSelect } from "./question-form-type-select";

export interface QuestionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  question?: Question;
  duplicateFrom?: Question;
  defaultQuizId?: string;
}

function QuestionFormModalBase({
  open,
  onClose,
  onSuccess,
  question,
  duplicateFrom,
  defaultQuizId = "",
}: QuestionFormModalProps) {
  const isEdit = !!question;
  const isDuplicate = !!duplicateFrom;
  const [step, setStep] = useState(isEdit || isDuplicate ? 1 : 0);
  const [selectedType, setSelectedType] = useState<string>(
    (question ?? duplicateFrom)?.type ?? "",
  );

  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion();
  const createDefaults = getCreateDefaults();

  const defaultValues = useMemo(() => {
    const source = question ?? duplicateFrom;
    if (source) {
      return {
        type: source.type,
        name: source.name,
        text: source.text,
        generalFeedback: source.generalFeedback,
        identificationNumber: source.identificationNumber,
        isActive: source.isActive,
        hasDuration: !!source.duration,
        durationValue: source.duration?.value ?? "",
        durationUnit: source.duration?.unit ?? "minute",
        moduleId: source.moduleId,
        correctAnswer: source.correctAnswer,
        feedbackTrue: source.feedbackTrue,
        feedbackFalse: source.feedbackFalse,
        options: source.options.map((o) => ({
          id: o.id,
          label: o.label,
          isCorrect: o.isCorrect,
          score: o.score,
          feedback: o.feedback,
        })),
        pairs: source.pairs.map((p) => ({
          id: p.id,
          question: p.question,
          answer: p.answer,
        })),
      };
    }
    return getCreateDefaults();
  }, [question, duplicateFrom]);

  const buildCreatePayloadFn = useCallback(
    (values: FieldValues) =>
      buildQuestionPayload(values as FormValues, defaultQuizId),
    [defaultQuizId],
  );

  const buildUpdatePayloadFn = useCallback(
    (values: FieldValues, id: string) => ({
      id,
      data: buildQuestionPayload(
        values as FormValues,
        question?.quizId ?? defaultQuizId,
      ),
    }),
    [question?.quizId, defaultQuizId],
  );

  const modal = useFormDrawer({
    open,
    onClose,
    onSuccess,
    entity: question,
    createMutation,
    updateMutation,
    schema: formSchema,
    defaultValues,
    createDefaults,
    buildCreatePayload: buildCreatePayloadFn,
    buildUpdatePayload: buildUpdatePayloadFn,
  });

  useEffect(() => {
    if (open) {
      modal.form.reset(defaultValues);
      const source = question ?? duplicateFrom;
      setStep(isEdit || isDuplicate ? 1 : 0);
      setSelectedType(source?.type ?? "");
    }
  }, [open, isEdit, isDuplicate, question, duplicateFrom, defaultValues, modal.form]);

  const onSelectType = useCallback((type: string) => {
    setSelectedType(type);
    setStep(1);
  }, []);

  const selectedTypeLabel = QUESTION_TYPE_OPTIONS.find(
    (o) => o.value === selectedType,
  )?.label;

  const title =
    isDuplicate ? "Dupliquer la question"
    : step === 0 ? "Nouvelle question"
    : (selectedTypeLabel ?? "Question");
  const description =
    "Configurez votre question, ajoutez les réponses et leurs feedbacks.";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && modal.handleClose()}>
      <DialogContent
        className="flex flex-col gap-0 p-0 inset-0 h-dvh max-w-full -translate-x-0 -translate-y-0 rounded-none sm:max-w-full"
        showCloseButton={true}
      >
        <DialogHeader
          className={cn(
            "border-b px-6 py-4 transition-all duration-300",
            step === 0 ? "border-transparent" : "border-border",
          )}
        >
          <div className="flex items-center gap-3">
            {step === 1 && !isEdit && !isDuplicate && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="-ml-1 shrink-0"
                onClick={() => {
                  const opts = modal.form.getValues("options");
                  if (opts) {
                    for (let i = 0; i < opts.length; i++) {
                      modal.form.setValue(`options.${i}.score`, 0);
                    }
                  }
                  modal.form.setValue("type", "");
                  setSelectedType("");
                  setStep(0);
                }}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2">
                {step === 1 && (
                  <span className="[&>svg]:size-4 shrink-0">
                    {TYPE_ICONS[selectedType]?.icon}
                  </span>
                )}
                <span className="truncate">{title}</span>
              </DialogTitle>
              {step === 1 && (
                <DialogDescription className="mt-0.5">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <Field {...modal.form}>
          <form
            onSubmit={modal.form.handleSubmit(modal.onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
            noValidate
          >
            <div className="relative min-h-0 flex-1">
              {modal.mutation.isError && (
                <div
                  role="alert"
                  className="mx-6 mt-5 mb-0 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {extractApiError(modal.mutation.error, isEdit)}
                </div>
              )}

              <div
                key="step-0"
                className={cn(
                  "absolute inset-0 transition-all duration-300 ease-in-out",
                  step === 0
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6 pointer-events-none",
                )}
              >
                <div className="flex h-full items-center justify-center p-6">
                  <div className="w-full max-w-lg">
                    <QuestionFormTypeSelect
                      onSelect={(type) => {
                        modal.form.setValue("type", type);
                        onSelectType(type);
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                key="step-1"
                className={cn(
                  "absolute inset-0 overflow-hidden px-6 py-5 transition-all duration-300 ease-in-out",
                  step === 1
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6 pointer-events-none",
                )}
              >
                <div className="grid h-full w-full auto-rows-fr grid-cols-1 gap-10 lg:grid-cols-2">
                  <div className="max-h-[75vh] overflow-y-auto">
                    <QuestionFormFieldsCommon form={modal.form} />
                  </div>

                  <div className="max-h-[75vh] overflow-y-auto pr-1">
                    {selectedType === "true_false" && (
                      <QuestionFormFieldsTrueFalse form={modal.form} />
                    )}

                    {(selectedType === "single_choice" ||
                      selectedType === "multiple_choice") && (
                      <QuestionFormFieldsChoices
                        form={modal.form}
                        selectedType={selectedType}
                      />
                    )}

                    {selectedType === "matching" && (
                      <QuestionFormFieldsMatching form={modal.form} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                step === 1
                  ? "opacity-100 translate-y-0 max-h-20"
                  : "opacity-0 translate-y-4 max-h-0 pointer-events-none overflow-hidden",
              )}
            >
              <DialogFooter className="border-t bg-background px-6 py-4 sm:justify-between">
                <div className="flex w-full items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={modal.handleClose}
                    disabled={modal.mutation.isPending}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={modal.mutation.isPending}
                    className="bg-(--color-primary) hover:bg-(--color-primary)/80"
                  >
                    {modal.mutation.isPending && (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    )}
                    {modal.mutation.isPending
                      ? isEdit
                        ? "Enregistrement…"
                        : "Création…"
                      : isEdit
                        ? "Enregistrer"
                        : "Créer"}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </form>
        </Field>
      </DialogContent>
    </Dialog>
  );
}

export const QuestionFormModal = memo(QuestionFormModalBase);
