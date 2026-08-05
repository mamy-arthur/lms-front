'use client';

import { QUESTION_TYPE_OPTIONS } from '@modules/shared/components/questions';
import { Loader2, Save } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { FieldValues } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Field } from '@/components/ui/field';

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
import { Separator } from '@/components/ui/separator';

export interface QuestionFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  question?: Question;
  duplicateFrom?: Question;
  defaultQuizId?: string;
}

function QuestionFormDrawerBase({
  open,
  onClose,
  onSuccess,
  question,
  duplicateFrom,
  defaultQuizId = '',
}: QuestionFormDrawerProps) {
  const isEdit = !!question;
  const isDuplicate = !!duplicateFrom;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>((question ?? duplicateFrom)?.type ?? '');

  // Sync parent `open` prop to internal dialog/drawer states
  useEffect(() => {
    if (open) {
      if (isEdit || isDuplicate) {
        setSelectedType((question ?? duplicateFrom)?.type ?? '');
        setDrawerOpen(true);
        setDialogOpen(false);
      } else {
        setSelectedType('');
        setDialogOpen(true);
        setDrawerOpen(false);
      }
    } else {
      setDialogOpen(false);
      setDrawerOpen(false);
    }
  }, [open, isEdit, isDuplicate, question, duplicateFrom]);

  const createMutation = useCreateQuestion();
  const updateMutation = useUpdateQuestion(question?.quizId ?? defaultQuizId);
  const createDefaults = getCreateDefaults();

  const defaultValues = useMemo(() => {
    const source = question ?? duplicateFrom;
    if (source) {
      return {
        type: source.type,
        competencyId: source.competencyId ?? '',
        question: source.text,
        commentIfCorrect: source.feedbackTrue || null,
        commentIfIncorrect: source.feedbackFalse || null,
        correctAnswer: source.correctAnswer,
        options: source.options.map((o) => ({
          id: o.id,
          label: o.label,
          isCorrect: o.isCorrect,
          weightPercentage: o.weightPercentage ?? 0,
        })),
        pairs: source.pairs.map((p) => ({
          left: p.question,
          right: p.answer,
        })),
      };
    }
    // Include selectedType so useFormDrawer resets with the correct type on drawer open
    return { ...getCreateDefaults(), type: selectedType };
  }, [question, duplicateFrom, selectedType]);

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
    open: drawerOpen,
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

  const onSelectType = useCallback((type: string) => {
    setSelectedType(type);
    setDialogOpen(false);
    setDrawerOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    onClose();
  }, [onClose]);

  const selectedTypeLabel = QUESTION_TYPE_OPTIONS.find((o) => o.value === selectedType)?.label;

  const drawerTitle = isDuplicate ? 'Dupliquer la question' : (selectedTypeLabel ?? 'Question');
  const description = 'Configurez votre question, ajoutez les réponses et leurs explications.';

  return (
    <>
      {/* Step 1 — Type selection dialog (create mode only) */}
      <Dialog open={dialogOpen} onOpenChange={(next) => !next && handleDialogClose()}>
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Choisir le type de question</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de question que vous souhaitez créer.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <QuestionFormTypeSelect onSelect={onSelectType} />
        </DialogContent>
      </Dialog>

      {/* Step 2 — Form drawer */}
      <Sheet open={drawerOpen} onOpenChange={(nextOpen) => !nextOpen && modal.handleClose()}>
        <SheetContent className="flex  flex-col gap-0 p-0 max-w-[45%]!" showCloseButton={true}>
          <SheetHeader className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <SheetTitle className="flex items-center gap-2">
                  <span className="[&>svg]:size-4 shrink-0">{TYPE_ICONS[selectedType]?.icon}</span>
                  <span className="truncate">{drawerTitle}</span>
                </SheetTitle>
                <SheetDescription className="mt-0.5">{description}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <Field {...modal.form}>
            <form
              onSubmit={modal.form.handleSubmit(modal.onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
              noValidate
            >
              {/* Scrollable content */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                {modal.mutation.isError && (
                  <div
                    role="alert"
                    className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {extractApiError(modal.mutation.error, isEdit)}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <QuestionFormFieldsCommon form={modal.form} />

                  <div>
                    {selectedType === 'true_false' && (
                      <QuestionFormFieldsTrueFalse form={modal.form} />
                    )}

                    {(selectedType === 'single_choice' || selectedType === 'multiple_choice') && (
                      <QuestionFormFieldsChoices form={modal.form} selectedType={selectedType} />
                    )}

                    {selectedType === 'matching' && (
                      <QuestionFormFieldsMatching form={modal.form} />
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-background px-4 py-4">
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
                  {modal.mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Enregistrer
                </Button>
              </div>
            </form>
          </Field>
        </SheetContent>
      </Sheet>
    </>
  );
}

export const QuestionFormDrawer = memo(QuestionFormDrawerBase);
