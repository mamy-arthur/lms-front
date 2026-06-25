"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRoot,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { QuestionType } from "../types";
import type { FormValues } from "./question-form-data";

interface ChoicesFieldsProps {
  form: UseFormReturn<FormValues>;
  selectedType: QuestionType;
}

export function QuestionFormFieldsChoices({
  form,
  selectedType,
}: ChoicesFieldsProps) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const watchedOptions = useWatch({
    control: form.control,
    name: "options",
  });

  // Seule source de vérité : score. "Correct" n'est qu'un libellé
  // d'affichage dérivé, jamais envoyé au backend.
  const isOptionCorrect = useCallback(
    (score: number) =>
      selectedType === "single_choice" ? score >= 100 : score > 0,
    [selectedType],
  );

  const totalChoices = watchedOptions?.length ?? optionFields.length;
  const correctCount =
    watchedOptions?.filter((o) => isOptionCorrect(o?.score ?? 0)).length ?? 0;

  const optionCount = optionFields.length;

  const handleScoreChange = useCallback(
    (index: number, value: number) => {
      const clamped = Math.min(100, Math.max(0, value));
      form.setValue(`options.${index}.score`, clamped);

      if (selectedType === "single_choice" && clamped >= 100) {
        for (let i = 0; i < optionCount; i++) {
          if (i !== index) {
            form.setValue(`options.${i}.score`, 0);
          }
        }
      }
    },
    [form, selectedType, optionCount],
  );

  const toggleCorrect = useCallback(
    (index: number) => {
      const current = form.getValues(`options.${index}.score`) ?? 0;
      handleScoreChange(index, isOptionCorrect(current) ? 0 : 100);
    },
    [form, handleScoreChange, isOptionCorrect],
  );

  return (
    <div className="rounded-lg bg-muted/40 min-h-full max-h-full flex flex-col">
      <div className="rounded-lg border bg-background p-4 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-medium">Choix</h4>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="bg-(--color-primary) hover:bg-(--color-primary)/80 text-primary-foreground hover:text-primary-foreground"
            onClick={() =>
              appendOption({
                id: `opt-${Date.now()}-${Math.random()}`,
                label: "",
                isCorrect: false,
                score: 0,
                feedback: "",
              })
            }
          >
            <Plus className="mr-1 size-3" />
            Ajouter plus de choix
          </Button>
        </div>

        {optionFields.length > 0 && (
          <p className="mb-3 text-xs text-muted-foreground">
            {totalChoices} choix · {correctCount} bonne
            {correctCount === 1 ? "" : "s"} réponse
            {correctCount === 1 ? "" : "s"}
          </p>
        )}

        {optionFields.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun choix. Cliquez sur "Ajouter".
          </p>
        ) : (
          <div className="space-y-2">
            {optionFields.map((field, index) => {
              const score = watchedOptions?.[index]?.score ?? 0;
              const isCorrect = isOptionCorrect(score);

              return (
                <div key={field.id} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <span className="w-4 shrink-0 text-xs text-muted-foreground">
                      {index + 1}
                    </span>

                    <Button
                      type="button"
                      variant={isCorrect ? "default" : "outline"}
                      size="icon"
                      className={
                        isCorrect
                          ? "size-5 shrink-0 text-xs text-white bg-(--color-primary) hover:bg-(--color-primary)/80"
                          : "size-5"
                      }
                      aria-label={
                        isCorrect
                          ? `Retirer la bonne réponse pour le choix ${index + 1}`
                          : `Marquer le choix ${index + 1} comme bonne réponse`
                      }
                      onClick={() => toggleCorrect(index)}
                    >
                      {isCorrect ? <Check className="size-4" /> : null}
                    </Button>

                    <FieldRoot
                      control={form.control}
                      name={`options.${index}.label`}
                      render={({ field: f }) => (
                        <FieldGroup className="flex-1 space-y-1">
                          <FieldLabel className="sr-only">
                            Libellé {index + 1}
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              aria-label={`Libellé ${index + 1}`}
                              placeholder="Libellé *"
                              {...f}
                            />
                          </FieldContent>
                          <FieldError />
                        </FieldGroup>
                      )}
                    />

                    {selectedType === "single_choice" ? (
                      <span className="w-10 shrink-0 text-center text-xs text-muted-foreground">
                        {score >= 100 ? "100" : "0"}
                      </span>
                    ) : (
                      <FieldRoot
                        control={form.control}
                        name={`options.${index}.score`}
                        render={({ field: f }) => (
                          <FieldGroup className="w-20 shrink-0 space-y-1">
                            <FieldLabel className="sr-only">
                              Note {index + 1}
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                aria-label={`Note ${index + 1}`}
                                value={f.value}
                                onChange={(e) =>
                                  handleScoreChange(
                                    index,
                                    Number(e.target.value),
                                  )
                                }
                              />
                            </FieldContent>
                            <FieldError />
                          </FieldGroup>
                        )}
                      />
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-destructive"
                      aria-label={`Supprimer le choix ${index + 1}`}
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>

                  <FieldRoot
                    control={form.control}
                    name={`options.${index}.feedback`}
                    render={({ field: f }) => (
                      <FieldGroup className="space-y-1">
                        <FieldLabel className="sr-only">
                          Feedback {index + 1}
                        </FieldLabel>
                        <FieldContent>
                          <Input
                            aria-label={`Feedback ${index + 1}`}
                            placeholder="Feedback (optionnel)"
                            {...f}
                          />
                        </FieldContent>
                        <FieldError />
                      </FieldGroup>
                    )}
                  />
                </div>
              );
            })}
          </div>
        )}

        {form.formState.errors.options && (
          <p className="mt-2 text-xs text-destructive" role="alert">
            {String(form.formState.errors.options.message ?? "")}
          </p>
        )}
      </div>
    </div>
  );
}
