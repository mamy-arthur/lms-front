'use client';

import { QUESTION_TYPE_OPTIONS } from '@modules/shared/components/questions';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { useFormDrawer } from '@/shared/components/form-drawer/use-form-drawer';
import { extractApiError } from '@/shared/utils/api-error';

import { useCreateQuestion } from '../hooks/useCreateQuestion';
import { useUpdateQuestion } from '../hooks/useUpdateQuestion';
import type { Question } from '../types';
import { QuestionFormFieldsChoices } from './question-form-fields-choices';
import { QuestionFormFieldsCommon } from './question-form-fields-common';
import { QuestionFormFieldsMatching } from './question-form-fields-matching';
import { QuestionFormFieldsTrueFalse } from './question-form-fields-true-false';
import {
  buildQuestionPayload,
  formSchema,
  FormValues,
  getCreateDefaults,
} from './question-form-data';
import { TYPE_ICONS } from './question-form-constants';
import { QuestionFormTypeSelect } from './question-form-type-select';

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
  defaultQuizId = '',
}: QuestionFormModalProps) {
  const isEdit = !!question;
  const isDuplicate = !!duplicateFrom;
  const [step, setStep] = useState(isEdit || isDuplicate ? 1 : 0);
  const [selectedType, setSelectedType] = useState<string>((question ?? duplicateFrom)?.type ?? '');

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
        referenceNumber: source.referenceNumber,
        isActive: source.isActive,
        hasDuration: !!source.duration,
        durationValue: source.duration?.value ?? '',
        durationUnit: source.duration?.unit ?? 'minute',
        moduleId: source.moduleId,
        correctAnswer: source.correctAnswer,
        feedbackTrue: source.feedbackTrue,
        feedbackFalse: source.feedbackFalse,
        options: source.options.map((option) => ({
          id: option.id,
          label: option.label,
          isCorrect: option.isCorrect,
          score: option.score,
          feedback: option.feedback,
        })),
        pairs: source.pairs.map((pair) => ({
          id: pair.id,
          question: pair.question,
          answer: pair.answer,
        })),
      };
    }
    return getCreateDefaults();
  }, [question, duplicateFrom]);

  const buildCreatePayloadFn = useCallback(
    (values: FieldValues) => buildQuestionPayload(values as FormValues, defaultQuizId),
    [defaultQuizId],
  );

  const buildUpdatePayloadFn = useCallback(
    (values: FieldValues, id: string) => ({
      id,
      data: buildQuestionPayload(values as FormValues, question?.quizId ?? defaultQuizId),
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
      setSelectedType(source?.type ?? '');
    }
  }, [open, isEdit, isDuplicate, question, duplicateFrom, defaultValues, modal.form]);

  const onSelectType = useCallback((type: string) => {
    setSelectedType(type);
    setStep(1);
  }, []);

  const selectedTypeLabel = QUESTION_TYPE_OPTIONS.find((o) => o.value === selectedType)?.label;

  const title = isDuplicate
    ? 'Dupliquer la question'
    : step === 0
      ? ''
      : (selectedTypeLabel ?? 'Question');
  const description = 'Configurez votre question, ajoutez les réponses et leurs explications.';

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && modal.handleClose()}>
      <SheetContent
        className={cn(
          'flex flex-col gap-0 p-0 transition-all duration-300',
          step === 0 && 'sm:max-w-lg',
          step === 1 && '!w-2/3 !max-w-[70%] [animation:none] transition-none',
        )}
        showCloseButton={true}
      >
        <SheetHeader
          className={cn(
            'border-b px-6 py-4 transition-all duration-300',
            step === 0 ? 'border-transparent' : 'border-border',
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
                  const opts = modal.form.getValues('options');
                  if (opts) {
                    for (let i = 0; i < opts.length; i++) {
                      modal.form.setValue(`options.${i}.score`, 0);
                    }
                  }
                  modal.form.setValue('type', '');
                  setSelectedType('');
                  setStep(0);
                }}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2">
                {step === 1 && (
                  <span className="[&>svg]:size-4 shrink-0">{TYPE_ICONS[selectedType]?.icon}</span>
                )}
                <span className="truncate">{title}</span>
              </SheetTitle>
              {step === 1 && <SheetDescription className="mt-0.5">{description}</SheetDescription>}
            </div>
          </div>
        </SheetHeader>

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

              {step === 0 && (
                <div className="absolute inset-0">
                  <div className="flex h-full justify-center p-6 pt-10">
                    <div className="w-full max-w-lg">
                      <QuestionFormTypeSelect
                        onSelect={(type) => {
                          modal.form.setValue('type', type);
                          onSelectType(type);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="absolute inset-0 overflow-hidden px-2 py-2">
                  <div className="grid h-full w-full gap-4 lg:grid-cols-[0.85fr_1.9fr]">
                    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-background/90 p-3 pt-6 ring-1 ring-border/10">
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                        <QuestionFormFieldsCommon form={modal.form} />
                      </div>
                    </section>

                    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-background p-6 ring-1 ring-border/10">
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                        {selectedType === 'true_false' && (
                          <QuestionFormFieldsTrueFalse form={modal.form} />
                        )}

                        {(selectedType === 'single_choice' ||
                          selectedType === 'multiple_choice') && (
                          <QuestionFormFieldsChoices
                            form={modal.form}
                            selectedType={selectedType}
                          />
                        )}

                        {selectedType === 'matching' && (
                          <QuestionFormFieldsMatching form={modal.form} />
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>

            {step === 1 && (
              <div className="flex w-full items-center justify-between gap-3 border-t bg-background px-6 py-4 sm:justify-end">
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
                  {modal.mutation.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
                  {modal.mutation.isPending
                    ? isEdit
                      ? 'Enregistrement…'
                      : 'Création…'
                    : isEdit
                      ? 'Enregistrer'
                      : 'Créer'}
                </Button>
              </div>
            )}
          </form>
        </Field>
      </SheetContent>
    </Sheet>
  );
}

export const QuestionFormModal = memo(QuestionFormModalBase);
